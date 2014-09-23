var crypto      = require('crypto');
var MongoDB     = require('mongodb').Db;
var Server      = require('mongodb').Server;
var moment      = require('moment');
var ICVL  = require('iconv-lite');
var UT        = require('./utility');
var ST = require('./setting');
var dbPort      = ST.dbPort;
var dbHost      = ST.dbHost;
var dbName      = ST.dbName;
var devServerSecret = ST.devServerSecret;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});

db.open(function(e, d){
	if (e) {
		console.log(e);
	}   else{
		console.log('connected to database :: ' + dbName);
	}
});

var score = db.collection('score');
var account = db.collection('account');
        
var md5 = function(str) {
	str = ICVL.encode(str, 'utf8');
	return crypto.createHash('md5').update(str).digest('hex');
}

var sha1 = function(str){
	str = ICVL.encode(str, 'utf8');
	return crypto.createHash('sha1').update(str).digest('hex');
}

UT.loadPrizeConfig('config/prize.json',function(e,o){});

var validateYoumi = function(feedData,devServerSecret){
	console.log(feedData);
	var keys = []
	for (k in feedData)
	{
		if (k!='sign' && feedData.hasOwnProperty(k))
		{
			keys.push(k);
		}
	}

	keys.sort();

	var sign = feedData['sign'];

	var len = keys.length;
	var kvs = "";

	for (var i=0; i< len; i++){
		kvs += keys[i]+"="+feedData[keys[i]];
	}
	kvs += devServerSecret;
	console.log(kvs,sign,md5(kvs));

	return sign == md5(kvs);
}

function addCoin(userId,points,callback){
	account.findOne({user_id:userId},function(e,o){
		if(e || !o){
			callback('no user found');
		}else{
			account.update({user_id:userId},{$inc:{coin:points}},{w:1},callback);
			UT.log(userId,'earn','ad',points,'');
			if(o.ask_code){
				awardBoss(o.ask_code,points);
			}
		}
	});
}

function awardBoss(shareCode,coins){
	account.count({ask_code:shareCode},function(e,o){
		if(o){
			var bossPrize = prizeConfig.boss;
			var prize = 0;
			for(var i=0; i<bossPrize.length; i++){
				if(o<bossPrize[i][0]){
					prize = Math.floor(coins*bossPrize[i][1]);
					break;
				}
			}
			account.update({share_code:shareCode},{$inc:{coin:prize,total_coin:prize,pupil_feed:prize}},{w:1},function(e,o){});
		}

	});
}

exports.scoreFromYoumi = function(feedData,callback){
	if (validateYoumi(feedData,ST.YoumiSecret)){
		score.findOne({order:feedData.order},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(feedData,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(feedData['device'],parseInt(feedData['points'],10),callback);
					}
				});
			}
		});
	}else{
	callback('validate sign fail');
	}
}

var validateDuomeng = validateYoumi;

exports.scoreFromDuomeng = function(feedData,callback){
	if (validateDuomeng(feedData,ST.DuomengSecret)){
		score.findOne({order:feedData.order},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(feedData,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(feedData['device'],parseInt(feedData['point'],10),callback);
					}
				});
			}
		});
	}else{
	callback('validate sign fail');
	}
}

var validateMiidi = function(feedData,secretKey){
	var srcSign = feedData['id']+feedData['trand_no']+feedData['cash'];
	if (feedData['param0']){
		srcSign += feedData['param0'];
	}
	srcSign += secretKey;
	console.log(md5(srcSign));

	return feedData['sign'] == md5(srcSign);

}

exports.scoreFromMiidi = function(feedData,callback){
	if(validateMiidi(feedData,ST.MiidiSecretKey)){
		score.findOne({trand_no:feedData.trand_no},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(feedData,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(feedData['imei'],parseInt(feedData['cash'],10),callback);
					}
				});
			}
		});

	}else{
		callback('validate sign fail');
	}

}

var validateDianru = function(feedData,callback){
	var params = "?hashid="+feedData['hashid']+"&appid="+feedData['appid']+"&adid="+feedData['adid']+"&adname="+feedData['adname']+"&userid="+feedData['userid']+"&deviceid="+feedData['deviceid']+"&source=dianru&point="+feedData['point']+"&time="+feedData['time']+"&appsecret="+feedData['appsecret']; 
	console.log(md5(params));
	return feedData['checksum'] == md5(params); 
}

exports.scoreFromDianru = function(feedData,callback){
	if(validateDianru(feedData,ST.DianruSecretKey)){
		score.findOne({hashid:feedData.hashid},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(feedData,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(feedData['deviceid'],parseInt(feedData['point'],10),callback);
					}
				});
			}
		});

	}else{
		callback('validate sign fail');
	}

}

var validateAarki = function(feedData,callback){
	var params = feedData['transaction_id'] + feedData['user_id'] + feedData['reward'];
	console.log(sha1(params));
	return feedData['sha1_signature'] == sha1(params);

}

exports.scoreFromAarki = function(feedData,callback){
	if(validateAarki(feedData,ST.AarkiSecretKey)){
		score.findOne({transaction_id:feedData.transaction_id},function(e,o){
			if(o){
				callback('duplication feed');
			}else{
				score.insert(feedData,{safe: true},function(e,o){
					if(e){
						callback('insert feed error');
					}else{
						addCoin(feedData['user_id'],parseInt(feedData['reward'],10),callback);
					}
				});
			}
		});

	}else{
		callback('validate sign fail');
	}

}


