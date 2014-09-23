var crypto      = require('crypto');
var MongoDB     = require('mongodb').Db;
var Server      = require('mongodb').Server;
var moment      = require('moment');
var UT        = require('./utility');

var ST = require('./setting');
var dbPort      = ST.dbPort;
var dbHost      = ST.dbHost;
var dbName      = ST.dbName;
var devServerSecret = ST.devServerSecret;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});

var account = db.collection('account');
var exchange = db.collection('exchange');
var sign = db.collection('sign');
var share = db.collection('share');
wishDb = db.collection('wish');
logger = db.collection('logger');

db.open(function(e, d){
	if (e) {
		console.log(e);
	}   else{
		console.log('connected to database :: ' + dbName);
	}
});

UT.loadPrizeConfig('config/prize.json',function(e,o){});
UT.loadExchangeConfig('config/exchange.json',function(e,o){
	console.log("load exchange config",e,o)});



exports.createAccount = function(deviceId,callback){
	if(!deviceId){
		callback('miss device id for the first time login');
	}
	account.findOne({device_id:deviceId},function(e,o){
		if(e || !o){
			UT.getRandId(account,"user_id",function(userId){
				console.log(userId);
				account.insert({user_id:userId,device_id:deviceId,create_time:moment().unix(),coin:prizeConfig.register,total_coin:prizeConfig.register,pupil_feed:0,pupil_num:0},callback);
				UT.log(userId,'earn','create user',prizeConfig.register,'');
			});

		}else{
			callback('user has existed');
		}

	});
}

exports.getUser = function(deviceId,userId,callback){
	if(userId){
		console.log("by user",userId,{user_id:userId});
		account.findOne({user_id:userId},function(e,o){
			console.log(e,o);
			if(e || !o){
				callback('no user found 1');
			}else{
				callback(null,o);
			}
		});
	}else{
		console.log("by device",deviceId);
		account.findOne({device_id:deviceId},function(e,o){
			if(e || !o){
				callback('no user found 2');
			}else{
				callback(null,o);
			}
		});
	}


}

exports.setAskCode = function(userId,askCode,callback){
	account.findOne({user_id:userId},function(e,o){
		if(e || !o){
			callback('no user found');
		}else if(o.ask_code!=undefined){
			callback('can not set ask code more than 1 time');
		}else{
			account.findOne({user_id:askCode},function(e,teacher){
				if(e || !teacher){
					callback('invalid askcode');
				}else{
					if(teacher.create_time > o.create_time){
						callback('teacher birth after student');
					}else{
						account.update({user_id:userId},{$set:{ask_code:askCode}},{w:1},callback);
						account.update({user_id:askCode},{$inc:{pupil_num:1}},{w:1},function(e,o){});
					}
				}
			});
			
		}
	});

}


exports.setContact = function(userId,contact,callback){
	account.update({user_id:userId},{$set:contact},{w:1},callback);
}

exports.setTokenId = function(userId,tokenId,callback){
	account.update({user_id:userId},{$set:{token_id:tokenId}},{w:1},callback);
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
				signInfo.signed_num = o.signed_num;
				signInfo.signed_today = false;
			}
		}
		callback(e,signInfo);
	});

}

exports.signIn = function(userId,callback){
	sign.findOne({user_id:userId},function(e,o){
		if(e || !o){
			account.update({user_id:userId},{$inc:{coin:prizeConfig.sign[0]}},function(e){
				sign.insert({user_id:userId,last_date:moment().format('YYYY-MM-DD'),signed_num:1},callback);
			});
		}else{

			if(moment().format('YYYY-MM-DD') == o.last_date){
				callback('signed today');

			}else if(moment().subtract('days',1).format('YYYY-MM-DD') == o.last_date){
				var num = (o.signed_num+1)%7;
				account.update({user_id:userId},{$inc:{coin:prizeConfig.sign[o.signed_num],total_coin:prizeConfig.sign[o.signed_num]}},function(e){
					sign.update({user_id:userId},{$set:{signed_num:num,last_date:moment().format('YYYY-MM-DD')}},{w:1},callback);
					UT.log(userId,'earn','sign',prizeConfig.sign[o.signed_num],'');
				});
			}else{
				account.update({user_id:userId},{$inc:{coin:prizeConfig.sign[0],total_coin:prizeConfig.sign[o.signed_num]}},function(e){
					sign.update({user_id:userId},{$set:{last_date:moment().format('YYYY-MM-DD'),signed_num:1}},
						callback);
					UT.log(userId,'earn','sign',prizeConfig.sign[o.signed_num],'');
				});

			}
		}
	});

}

exports.exchange = function(userId,type,num,callback){
	account.findOne({user_id:userId},function(e,o){
		if(e || !o){
			callback('no user found');
		}else {
			if(exchangeConfig[type] && exchangeConfig[type][num]){
				var cost = exchangeConfig[type][num];
				console.log(o.coin,cost,o.coin < cost);
				if(o.coin < cost){
					callback('no enough coins');
				}else{
					account.update({user_id:userId},{$inc:{coin:-cost}},{w:1},function(e,o){
						if(o>0){
							exchange.insert({user_id:userId,type:type,num:num,date:moment().format('YYYY-MM-DD'),completed:false},function(e,o){});
							UT.log(userId,'exchange',type,-cost,num);
						}
						callback(null);
					});
				}
			}else{
				callback('type or num error');
			}
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
							account.update({user_id:userId},{$inc:{coin:prizeConfig.share,total_coin:prizeConfig.share}},function(e,o){
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
}
