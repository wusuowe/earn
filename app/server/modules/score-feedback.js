var crypto      = require('crypto');
var moment      = require('moment');
var UT        = require('./utility');
var UPG        = require('./upgrade');
var ST = require('./setting');
var secretKey = ST.secretKey;

var db = require('./database').db;
var score = db.collection('score');
var account = db.collection('account');
        
var validateYoumi = function(fd,secretKey){
	console.log(fd);
	var keys = []
	for (k in fd)
	{
		if (k!='sign' && fd.hasOwnProperty(k))
		{
			keys.push(k);
		}
	}

	keys.sort();

	var sign = fd['sign'];

	var len = keys.length;
	var kvs = "";

	for (var i=0; i< len; i++){
		kvs += keys[i]+"="+fd[keys[i]];
	}
	kvs += secretKey;
	console.log(kvs,sign,UT.md5(kvs));

	return sign == UT.md5(kvs);
}

var validateLimei = function(fd,secretKey){
	console.log(fd);
	var keys = []
	for (k in fd)
	{
		if (k!='sign' && fd.hasOwnProperty(k))
		{
			keys.push(k);
		}
	}

	keys.sort();

	var sign = fd['sign'];

	var len = keys.length;
	var kvs = "";

	for (var i=0; i< len; i++){
		kvs += keys[i]+"="+fd[keys[i]];
	}
	signed = UT.hmac(kvs,secretKey);
	console.log(kvs,sign,signed);

	return sign == signed;
}

function addCoin(userId,deviceId,points,desc,callback){
	account.findOne({$or:[{user_id:userId},{device_id:deviceId}]},function(e,o){
		if(e || !o){
			callback('User is not existing.');
		}else{
			var now = moment().unix();
			if(!o.task_time || (o.task_time+90) < now){
				var ratio = 1.0;
				if(!o.level && o.level>=2 && o.level<=7){
					ratio = 1+levelConfig[o.level-2].ratio;
				}
				account.update({user_id:o.user_id},{$inc:{coin:points*ratio},$set:{new_income:1,task_time:now}},{w:1},callback);
				UT.log(o.user_id,'earn','ad',points*ratio,desc);
				UPG.logCoin(o.user_id,points);
				if(o.ask_code){
					awardBoss(o.user_id,o.ask_code,points);					
				}
			}else{
				account.update({user_id:o.user_id},{$set:{task_time:now}},callback);
				UT.log(o.user_id,'warn','ad',points,desc);
			}
		}
	});
}

function awardBoss(userId,shareCode,coins){
	console.log({ask_code:shareCode});
	var fiveDayStamps = moment().unix() - 3600*24*5;
	account.count({ask_code:shareCode,last_login:{$gt:fiveDayStamps}},function(e,o){
		if(o){
			var bossPrize = prizeConfig.boss;
			var prize = 0;
			for(var i=0; i<bossPrize.length; i++){
				if(o<bossPrize[i][0]){
					prize = Math.floor(coins*bossPrize[i][1]);
					break;
				}
			}
			account.update({user_id:shareCode},{$inc:{coin:prize,total_coin:prize,pupil_feed:prize},$set:{new_income:1}},{w:1},function(e,o){
				console.log({user_id:shareCode},{$inc:{coin:prize,total_coin:prize,pupil_feed:prize}});
				UT.log(shareCode,'share','',prize,userId);
				UPG.logFeed(userId,prize);
			});

			account.userId({user_id:userId},{$inc:{feed_num:1,feed_coin:prize}},UT.printError);
		}

	});
}

exports.postbackLimei = function(fd,os,callback){
	if (validateLimei(fd,ST.LimeiSecret[os])){
		fd = formatFeedData(fd,os,'Limei');	
		score.findOne({orderId:fd.orderId,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}
		});
	}else{
	callback('validate sign fail');
	}
}


exports.postbackYoumi = function(fd,os,callback){
	if (validateYoumi(fd,ST.YoumiSecret[os])){
		fd = formatFeedData(fd,os,'Youmi');	
		score.findOne({order:fd.order,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}
		});
	}else{
	callback('validate sign fail');
	}
}

var validateDuomeng = validateYoumi;

exports.postbackDuomeng = function(fd,os,callback){
	if (validateDuomeng(fd,ST.DuomengSecret[os])){
		fd = formatFeedData(fd,os,'Duomeng');	
		score.findOne({orderid:fd.orderid,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}
		});
	}else{
	callback('validate sign fail');
	}
}

var validateMiidi = function(fd,secretKey){
	var srcSign = fd['id']+fd['trand_no']+fd['cash'];
	if (fd['param0']){
		srcSign += fd['param0'];
	}
	srcSign += secretKey;
	console.log(UT.md5(srcSign));

	return fd['sign'] == UT.md5(srcSign);

}

exports.postbackMiidi = function(fd,os,callback){
	if(validateMiidi(fd,ST.MiidiSecret[os])){
		fd = formatFeedData(fd,os,'Miidi');	
		score.findOne({trand_no:fd.trand_no,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}
		});

	}else{
		callback('validate sign fail');
	}

}

var validateDianru = function(fd,callback){
	var params = "?hashid="+fd.hashid+"&appid="+fd.appid+"&adid="+fd.adid+"&adname="+fd.adname+"&userid="+fd.userid+"&deviceid="+fd.deviceid+"&source=dianru&point="+fd.point+"&time="+fd.time+"&appsecret="+fd.appsecret; 
	console.log(UT.md5(params));
	return fd.checksum == UT.md5(params); 
}

exports.postbackDianru = function(fd,os,callback){
	if(validateDianru(fd,ST.DianruSecret[os])){
		fd = formatFeedData(fd,os,'Dianru');	
		score.findOne({hashid:fd.hashid,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}
		});

	}else{
		callback('validate sign fail');
	}

}

var validateCoco = function(fd,secretKey){
	console.log(fd);
	var keys = []
	for (k in fd)
	{
		if (k!='sign' && fd.hasOwnProperty(k) && fd[k]!=null)
		{
			keys.push(k);
		}
	}

	keys.sort();

	var sign = fd['sign'];

	var len = keys.length;
	var kvs = "";

	for (var i=0; i< len; i++){
		kvs += keys[i]+"="+encodeURIComponent(fd[keys[i]])+"&";
	}
	kvs += "secret="+secretKey;
//	kvs += "secret="+"secretvalue";
	console.log(kvs,sign,UT.md5(kvs));

	return sign == UT.md5(kvs);
}

exports.postbackCoco = function(fd,os,callback){
	if(validateCoco(fd,ST.CocoSecret[os])){
		fd = formatFeedData(fd,os,'Coco');	
		score.findOne({transactionid:fd.transactionid,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}
		});

	}else{
		callback('validate sign fail');
	}

}


var validateWanpu = function(fd,key){
	var ks = fd.adv_id+fd.app_id+fd.key+fd.udid+fd.bill+fd.points+UT.rawurlencode(fd.activate_time)+fd.order_id+key;
	console.log(ks,fd.wapskey,UT.md5(ks));
	return fd.wapskey==UT.md5(ks).toUpperCase();
}

exports.postbackWanpu = function(fd,os,callback){
	if(validateWanpu(fd,ST.WanpuSecret[os])){
		fd = formatFeedData(fd,os,'Wanpu');	
		score.findOne({order_id:fd.order_id,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						if(fd.bill!="0" && fd.bill!="null" && fd.status == "1"){
							addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
						}else{
							callback('error parameters');
						}
					}
				});
			}
		});

	}else{
		callback('validate sign fail');
	}

}

var validateYijifen = function(params,signed,secretKey){

	sign = UT.md5(params+secretKey,secretKey);
	console.log(params+secretKey,sign,signed);

	return sign == signed;
}


exports.postbackYijifen = function(req,os,callback){
	var fd = req.query;
	var params = req.originalUrl.replace(req.path+"?","").replace("&sign="+fd.sign,""); 

	if(validateYijifen(params,fd.sign,ST.YijifenKey[os])){
		fd = formatFeedData(fd,os,'Yijifen');	
		score.findOne({adId:fd.adId,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,function(e,o){
							callback(e,fd.eventId+":OK");
						});
					}
				});
			}

		});
	}else{
		callback('error signature');
	}

}	

var validateAarki = function(fd,key){
	var params = fd['transaction_id'] + fd['user_id'] + fd['reward']+key;
	console.log(params,UT.sha1(params));

	return fd['sha1_signature'] == UT.sha1(params);

}

exports.postbackAarki = function(fd,os,callback){
	if(validateAarki(fd,ST.AarkiSecret[os])){
		fd = formatFeedData(fd,os,'Aarki');	
		score.findOne({transaction_id:fd.transaction_id,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}
		});

	}else{
		callback('validate sign fail');
	}

}
var validateTokenads = function(hash,signed,key){
	console.log(hash+key,signed,UT.md5(hash+key));

	return signed == UT.md5(hash+key);

}

exports.postbackTokenads = function(fd,os,callback){
	if(validateTokenads(fd.hash,fd.sign,ST.TokenadsKey[os])){
		fd = formatFeedData(fd,os,'Tokenads');	
		score.findOne({transaction_id:fd.transaction_id,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}
		});

	}else{
		callback('validate sign fail');
	}

}


	
exports.postbackNativeX = function(fd,os,callback){
	fd = formatFeedData(fd,os,'NativeX');	
	console.log(fd);
	score.findOne({fd_user:fd.fd_user,OfferId:fd.OfferId,platform:fd.platform},function(e,o){
		if(o){
			callback('duplication feed');
		}else{
			score.insert(fd,{safe: true},function(e,o){
				if(e){
					callback('insert feed error');
				}else{
					addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
				}
			});
		}
	});

}
var validateSuperSonic = function(fd,key){
	var params = fd.timestamp+fd.eventId+fd.appUserId+fd.rewards+key;
	console.log("supper sonic sign:"+fd.signature+" vs "+UT.md5(params));
	return fd.signature == UT.md5(params);
}
exports.postbackSuperSonic = function(fd,os,callback){
	if(validateSuperSonic(fd,ST.SuperSonicKey[os])){
		fd = formatFeedData(fd,os,'SuperSonic');	
		score.findOne({eventId:fd.eventId,platform:fd.platform},function(e,o){
			if(o){
				callback(e,fd.eventId+":OK");
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,function(e,o){
							callback(e,fd.eventId+":OK");
						});
					}
				});
			}

		});
	}else{
		callback('error signature');
	}

}	

var validateTrialpay = function(params,signed,secretKey){

	sign = UT.hmacMD5(params,secretKey);
	console.log(params,sign,signed);

	return sign == signed;
}


exports.postbackTrialpay = function(req,os,callback){
	var fd = req.query;
	var params = req.originalUrl.replace(req.path+"?",""); 
	var signed = req.headers['trialpay-hmac-md5'];

	if(validateTrialpay(params,signed,ST.TrialpayKey[os])){
		fd = formatFeedData(fd,os,'Trialpay');	
		score.findOne({oid:fd.oid,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,function(e,o){
							callback(e,fd.eventId+":OK");
						});
					}
				});
			}

		});
	}else{
		callback('error signature');
	}

}	

var validatePlayerize = function(fd,key){
	var kvs = fd['id']+":"+fd['new']+";"+fd['uid']+":"+key;
	var sign = fd['sig'];
	console.log("sign:",UT.md5(kvs));
	return sign == UT.md5(kvs);
}

exports.postbackPlayerize = function(fd,os,callback){
	if(validatePlayerize(fd,ST.PlayerizeKey[os])){
		fd = formatFeedData(fd,os,'Playerize');	
		score.findOne({id:fd.id,platform:fd.platform},function(e,o){
			if(e){
				callback(e);
			}else if(o){
				callback('duplication feed');
			}else{
				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}

		})
	}else{
		callback('error signature');
	}
}	

var validateFyber = function(fd,key){
	var kvs = key+fd['user_id']+fd['amount']+fd["_trans_id_"];
	var sign = fd['sid'];
	console.log("sign:",UT.sha1(kvs));
	return sign ==UT.sha1(kvs);
}
exports.postbackFyber = function(fd,callback){
	if(validateFyber(fd,ST.FyberKey)){
		fd = formatFeedData(fd,os,'Fyber');	
		score.findOne({_trans_id_:fd._trans_id_,platform:fd.platform},function(e,o){
			if(o){
				callback('duplication feed');
			}else{

				score.insert(fd,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(fd.fd_user,fd.fd_device,fd.fd_coin,fd.fd_adname,callback);
					}
				});
			}

		})
	}else{
		callback('error signature');
	}

}	

var nameMap = {
	Limei:{
		fd_user:'user',
		fd_device:'adi',
		fd_coin:'point',
		fd_adname:'adname'
		},
	Duomeng:{
		fd_user:'user',
		fd_device:'device',
		fd_coin:'point',
		fd_adname:'adname'
		},
	Miidi:{
		fd_user:'user',
		fd_device:'imei',
		fd_coin:'cash',
		fd_adname:'appName'
		},
	Dianru:{
		fd_user:'userid',
		fd_device:'device',
		fd_coin:'point',
		fd_adname:'adname'
		},
	Coco:{
		fd_user:'token',
		fd_device:'idfa',
		fd_coin:'coins',
		fd_adname:'adtitle'
		},
	Wanpu:{
		fd_user:'user',
		fd_device:'udid',
		fd_coin:'points',
		fd_adname:'ad_name'
		},
	Yijifen:{
		fd_user:'userID',
		fd_device:'idfa',
		fd_coin:'score',
		fd_adname:'adName'
		},
	Aarki:{
		fd_user:'user_id',
		fd_device:'idfa',
		fd_coin:'reward',
		fd_adname:'offer_id'
		},
	Tokenads:{
		fd_user:'uid',
		fd_device:'idfa',
		fd_coin:'award',
		fd_adname:'adName'
		},
	Playerize:{
		fd_user:'uid',
		fd_device:'device',
		fd_coin:'new',
		fd_adname:'adname'
		},
	SuperSonic:{
		fd_user:'appUserId',
		fd_device:'device',
		fd_coin:'rewards',
		fd_adname:'adname'
		},
	NativeX:{
		fd_user:'publisherUserId',
		fd_device:'device',
		fd_coin:'devicePayoutInCurrency',
		fd_adname:'offerName'
		},
	Trialpay:{
		fd_user:'userid',
		fd_device:'device',
		fd_coin:'reward_amount',
		fd_adname:'adname'
		},
	Fyber:{
		fd_user:'user_id',
		fd_device:'device',
		fd_coin:'amount',
		fd_adname:'adname'
	}
};
var formatFeedData = function(fd,os,platform){
	fd.platform = platform;
	fd.fd_time = moment().unix();
	switch(platform){
		case 'Miidi':
			fd.imei = fd.imei.toUpperCase(); 
			break;
		case 'Wanpu':
			fd.udid = fd.udid.toUpperCase();
			break;
		case 'NativeX':
			if(os=='android'){
				fd.device = fd.androidDeviceId || fd.androidIDFA;
			}else{
				fd.device = fd.iosIDFA;
			}
			delete fd['androidIDFA'];
			delete fd['androidDeviceId'];
			delete fd['iosIDFA'];
			break;
	}
	var user   = nameMap[platform].fd_user;
	var device = nameMap[platform].fd_device;
	var coin   = nameMap[platform].fd_coin;
	var adname = nameMap[platform].fd_adname;
	
	if(fd[user]){
		fd.fd_user = fd[user];
		delete fd[user];
	}
	if(fd[device]){
		fd.fd_device = fd[device];
		delete fd[device];
	}
	if(fd[coin]){
		fd.fd_coin = parseInt(fd[coin],10);;
		delete fd[coin];
	}
	fd.fd_adname = '';
	if(fd[adname]){
		fd.fd_adname = fd[adname];
		delete fd[adname];
	}
	return fd;
}

