var crypto      = require('crypto');
var moment      = require('moment');
var UT        = require('./utility');
var CM = require('./campaign');
var UPG = require('./upgrade');
var db = require('./database').db;
var account = db.collection('account');
var exchange = db.collection('exchange');
var sign = db.collection('sign');
var share = db.collection('share');
var wishDb = db.collection('wish');
var logger = db.collection('logger');
var login = db.collection('login');
var score = db.collection('score');
var correlation = db.collection('correlation');
exports.createAccount = function(deviceId,ip,callback){
	if(!deviceId){
		callback('miss device id for the first time login');
	}else{
		account.findOne({device_id:deviceId},function(e,o){
			if(e || !o){
				UT.getRandId(account,"user_id",function(userId){
					var user = {
						user_id:userId,device_id:deviceId,create_time:moment().unix(),
						coin:prizeConfig.register,total_coin:prizeConfig.register,pupil_feed:0,
						pupil_num:0,ask_code:"",new_income:1,level:1,feed_num:0,feed_coin:0
					};
					account.insert(user,function(e,o){
						callback(e,o);
						recordAccessInfo(user,ip);
					});
					UT.log(userId,'earn','create user',prizeConfig.register,'');
					//CM.recordConvert(deviceId,userId);
				});
			}else{
				callback('user is existed');
			}
		});
	}
}
var recordAccessInfo= function(user,ip){
	if(ip != user.client_ip || !user.location){
		
		UT.ip2location(ip,function(e,loc){
			account.update({user_id:user.user_id},{$set:{last_login:moment().unix(),client_ip:ip,location:loc}},function(err){
				(err)?console.log(err):null;
			});
			account.update({user_id:user.user_id,register_location:null},{$set:{register_location:loc}},function(err){
				(err)?console.log(err):null;
			});

			login.update({user_id:user.user_id,ip:ip},{$set:{location:loc}},{upsert:true},function(e,o){console.log(e,o)});
		});
	}else{
		account.update({user_id:user.user_id},{$set:{last_login:moment().unix(),client_ip:ip}},function(err){
			(err)?console.log(err):null;
		});

	}

}

var sameLoction =function(loc1,loc2){
	if(loc1 == loc2){
		return true;
	}
	return (loc1.split(" ").length>1 && loc2.split(" ").length);
}

exports.openOfferWall = function(userId,callback){
	account.findOne({user_id:userId},function(e,o){
		var walls = JSON.parse(JSON.stringify(offerWallConfig));
		if(e || !o){
			walls.open = false;
		}else{
			walls.open = (o.location==o.register_location);
		}
		getOfferWallStat(walls,callback);
	});
}

function getOfferWallStat(walls,callback){
	var ret = {};
	ret.open = walls.open;
	ret.walls = [];
	var numMap = {};
	score.group(['platform'], {}, {"count":0}, "function (obj, prev) { prev.count++; }",      
        function(e,docs){
			docs.forEach(function(doc){
				numMap[doc.platform] = doc.count;
			});
			walls.walls.forEach(function(w){
				var wall = {'platform':w,'count':0};
				wall.count =(numMap[w])?numMap[w]:0;
				ret.walls.push(wall);
			});

			callback(null,ret);
   });
}

exports.getCoin = function(userId,ip,callback){
	account.findOne({user_id:userId},function(e,o){
		if(e || !o){
			callback('User is not existing.');
		}else{
			callback(null,{coin:o.coin,new_income:o.new_income});
			recordAccessInfo(o,ip);
		}
	});

}

exports.getIpStatus = function(userId,callback){
	account.findOne({user_id:userId},function(e,o){
		if(e || !o){
			callback('User is not existing.');
		}else{
			callback(null,{coin:o.coin,new_income:o.new_income});
			recordAccessInfo(o,ip);
		}
	});
}

exports.getUser = function(deviceId,userId,callback){
	account.findOne({$or:[{user_id:userId},{device_id:deviceId}]},function(e,o){
		if(e || !o){
			callback('User is not existing.');
		}else{
			if(o.status == -1){
				o.user_id="000000";
				o.coin = 0;
			}
			o.earn_method = earnConfig.enable;
			account.update({user_id:o.user_id},{$set:{last_login:moment().unix()}}
				,function(e,u){
				refreshFriendNum(o.user_id,function(e,num){
					o.pupil_num = num;
					callback(null,o);
				});
				if(o.ask_code && o.ask_code!=""){
					refreshFriendNum(o.ask_code,UT.printError);
				}
			});	
			signin(o.user_id,UT.printError);		
		}
	});

}

var refreshFriendNum =function(userId,callback){
	var fiveDayStamps = moment().unix() - 3600*24*5;
	account.count({ask_code:userId,last_login:{$gt:fiveDayStamps}},function(e,n){
		account.update({user_id:userId},{$set:{pupil_num:n}},function(e,o){
			callback(e,n);
		});
	});
}

exports.getBonusDetail = function(userId,page,callback){
	var limit = 20;
	var start = limit * page;
	var query = {ask_code:userId};
	console.log(query);
	account.find(query,{sort:{feed_coin:-1},skip:start,limit:limit},function(e,o){
		if(e){
			callback(e,null);
		}else if(!o){
			callback(null,{});
		}else{
			var ret = [];
			o.toArray(function(e,recs){
				recs.forEach(function(r){
					var name = (r.name)?("("+r.name+")"):"";
					ret.push({"friends":r.user_id+name,"offers":r.feed_num,"bonus":r.feed_coin});
				});
				callback(null,ret);
			});

			
		}
	});
}
exports.getBonus = function(userId,callback){
	account.findOne({user_id:userId},function(e,o){
		if(e || !o){
			callback(e,{});
		}else{
			var bossPrize = prizeConfig.boss;
			var ratio = 0;

			for(var i=0; i<bossPrize.length; i++){
				if(o.pupil_num<bossPrize[i][0]){
					ratio = bossPrize[i][1];
					break;
				}
			}
			callback(null,{"friends":o.pupil_num,"ratio":ratio*100+"%","bonus":o.pupil_feed});
		}
	});
}

exports.setAskCode = function(userId,askCode,callback){
	if(userId == askCode){
		callback('You can not invite yourself');

	}else{
	account.findOne({user_id:userId},function(e,o){
		if(e || !o){
			callback('User is not existing.');
		}else if(o.ask_code!=undefined && o.ask_code!=""){
			callback('Invite code is unchangable.');
		}else{
			account.findOne({user_id:askCode},function(e,teacher){
				if(e || !teacher){
					callback('invalid invite code');
				}else{
					if(teacher.ask_code != userId){
						account.update({user_id:userId},{$set:{ask_code:askCode,new_income:1},$inc:{coin:prizeConfig.recruit}},{w:1},callback);
						account.update({user_id:askCode},{$inc:{pupil_num:1}},{w:1},function(e,o){});
						refreshFriendNum(askCode,UT.printError);
						UT.log(userId,'earn','recruit',prizeConfig.recruit,"");
						UT.alertUser(askCode,alertConfig.askcode_set.replace("#USER_ID#",userId));
						UPG.logFriend(askCode);

					}else{
						callback('You cannot input the code from the friend invited by you!');
					}
				}
			});
			
		}
	});
	}

}


exports.setContact = function(userId,contact,callback){
	account.update({user_id:userId},{$set:contact},{w:1},callback);
	if(contact.email != ''){
		UPG.logContact(userId);
	}
}

exports.setTokenId = function(userId,tokenId,callback){
	account.update({user_id:userId},{$set:{token_id:tokenId}},function(e,o){
		callback(e,"");
	});
}

exports.setAccountStatus = function(userId,status,callback){
	account.findOne({user_id:userId},function(e,u){
		if(u){
			status = parseInt(status);
			account.update({user_id:userId},{$set:{status:status}},callback);
			if(status==-1 && u.ask_code && u.ask_code!=""){
				logger.find({type:"share",note:userId},function(e,o){
					var sum = 0;
					if(o){
						o.toArray(function(e,a){
							a.forEach(function(r){
								if(r.status==null || r.status != 0){
									sum += r.coin;
								}
							});
							logger.update({type:"share",note:userId},{$set:{status:0}},function(e,o){
								if(e){console.log(e);}
							});

							if(sum > 0){
								account.update({user_id:u.ask_code},{$inc:{pupil_num:-1,coin:-sum}},function(e,o){
									if(e){console.log(e);}
								});

								UT.alertUser(u.ask_code,alertConfig.friend_suspend.replace("#USER_ID#",userId));
							}

						});
					}
				});
			}
		}else{
			callback(e,u);
		}

	});
}

exports.getSignInfo = function(userId,callback){
	sign.findOne({user_id:userId},function(e,o){
		var signInfo = {
			signed_num:0,
			signed_today:false,
			prize:prizeConfig.sign
		};
		if(o){
			if(moment().format('YYYY-MM-DD') == o.last_date){
				signInfo.signed_num = o.signed_num;
				signInfo.signed_today = true;
			}else if(moment().subtract('days',1).format('YYYY-MM-DD') == o.last_date){
				signInfo.signed_num = o.signed_num%7;
				signInfo.signed_today = false;
			}
		}
		callback(e,signInfo);
	});

}
var version2int = function(ver){
	var sum = 0;
	ver.split(".").forEach(function(i){
		sum=sum*1000+parseInt(i);
	});
	console.log(sum);
	return sum;
}
var printError=function(e,o){
	if(e){
		console.log(e);
	}
}
exports.checkUpdate=function(args,callback){
	account.findOne({user_id:args.user_id},{_id:0,client:1},function(e,o){
		if(e || !o){
			callback('User is not existing.');
		}else{
			var newVersion = versionConfig[args.os].ver;
			if(o.client && o.client.version && (parseInt(o.client.version) < newVersion)){
				callback(null,versionConfig[args.os]);
			}else{
				callback(null,"");
			}
			if(args.os){
				account.update({user_id:args.user_id},{$set:{client:args}},printError);
			}
		}
	});

}

exports.askFriend=function(userId,channel,callback){
	callback(null,"");
	UT.log(userId,'ask','',0,channel);
}

exports.setClientVersion=function(userId,version){
	if(version && version!=''){
		account.update({user_id:userId},{$set:{client_version:version}},function(e,o){});
	}
}

var signin= function(userId,callback){
	sign.findOne({user_id:userId},function(e,o){
		console.log("signin ... 1");
		if(e || !o){
			sign.insert({user_id:userId,last_date:moment().format('YYYY-MM-DD'),signed_num:1},function(e,o){
				// account.update({user_id:userId},{$set:{new_income:1},$inc:{coin:prizeConfig.sign[0]}},function(e,o){
					// callback(e,"get "+prizeConfig.sign[0]+ " coins for sign");
				// });
				// UT.log(userId,'earn','sign',prizeConfig.sign[0],"");

				callback(e,"can not get coin by signin now");

			});
			UPG.logLogin(userId,1);
		}else{
			console.log("signin ... 2");

			if(moment().format('YYYY-MM-DD') == o.last_date){
				callback('Already signed-in today');

			}else {
				var num = 0;
				if(moment().subtract('days',1).format('YYYY-MM-DD') == o.last_date){
					num = o.signed_num%7;
				}
				UPG.logLogin(userId,num+1);
				sign.update({user_id:userId},{$set:{signed_num:num+1,last_date:moment().format('YYYY-MM-DD')}},{w:1},function(e,o){
					// account.update({user_id:userId},{$set:{new_income:1},$inc:{coin:prizeConfig.sign[num],total_coin:prizeConfig.sign[num]}},function(e,o){
						// callback(e,"get "+prizeConfig.sign[num]+ " coins for sign");
					// });
					// UT.log(userId,'earn','sign',prizeConfig.sign[num],"");
					callback(e,"can not get coin by signin now");

				});

				

			}
		}
	});

}
exports.signIn = signin;
var checkAccountDup = function(userId,desc,callback){
	var account = desc.toLowerCase().replace(/ /g,'');
	correlation.findOne({account:account},function(e,o){
		if(e || !o){
			correlation.insert({user_id:userId,account:account},callback);
		}else{
			if(o.user_id == userId){
				callback(null);
			}else{
				callback('more than one user associate with the account');
			}
		}
	});

}

var exchangeRatio;
exports.exchange = function(userId,type,num,desc,name,mail,callback){
	if(!exchangeRatio){
		exchangeRatio = UT.getExhangeRatio();
	}
	if(desc){
		name = "";
	}else{
		desc = mail;
	}
//	console.log(exchangeRatio,userId,type,num,desc);
	
	account.findOne({user_id:userId},function(e,o){
		if(e || !o){
			callback('User is not existing.');
		}else {
			checkAccountDup(userId,desc,function(err){
				if(err){
					callback(err);
				}else{
					if(exchangeRatio[type] && exchangeRatio[type][num]){
						var cost = exchangeRatio[type][num].coin;
						var rebate = exchangeRatio[type][num].rebate;
						console.log(o.coin,cost,o.coin < cost);
						if(o.coin < cost){
							callback('no enough zeen');
						}else{
							account.update({user_id:userId},{$inc:{coin:-cost}},{w:1},function(e,o){
								if(o>0){
									exchange.insert({user_id:userId,type:type,num:num,name:name,desc:desc,cost:cost,rebate:rebate,date:moment().format('YYYY-MM-DD'),status:"create"},function(e,o){});
									UT.log(userId,'exchange',type,-cost,num);
								}
								callback(null,"");
							});
						}
					}else{
						callback('type or num error');
					}
				}
			});
		}
	});
}

exports.share = function(userId,channel,callback){
	var today = moment().format('YYYY-MM-DD');
	share.count({user_id:userId,date:today},function(e,beforeNum){
		if(e){
			callback(e);
		}else{
		
			share.update({user_id:userId,channel:channel,date:today},{$set:{user_id:userId,channel:channel,date:today}}, { upsert: true },function(e,o){

				if(e){
					callback(e);
				}else{
					share.count({user_id:userId,date:today},function(e,afterNum){
						if(e){
							callback(e);
						}else if(beforeNum==2 && afterNum==3){
							account.update({user_id:userId},{$set:{new_income:1},$inc:{coin:prizeConfig.share,total_coin:prizeConfig.share}},function(e,o){
								callback(e,"get prize "+ prizeConfig.share);
								UT.log(userId,'earn','share',prizeConfig.share,'');
							});
						}else{
							callback(null,"today shared "+afterNum);
						}

					});
				}

			});
		}
		
	});
	UPG.logShare(userId);
}
