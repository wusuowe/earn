var crypto      = require('crypto');
var moment      = require('moment');
var UT      = require('./utility');

var ST = require('./setting');
var db = require('./database').db;

var scratch = db.collection('scratch');
var account = db.collection('account');
var slyder = db.collection('slyder');
var codeDb = db.collection('codes');
var lottery = db.collection('lottery');


var rnd = function(start, end){
	    return Math.floor(Math.random() * (end - start) + start);
};

var rand6 = function(callback){
	var n = rnd(100000,1000000);
	codeDb.findOne({code:n},function(e,o){
		if(o){
			rand6(callback);
		}else{
			callback(n);
		}
	});

}



function draw(pool){
	var sum = 0;
	for(k in pool){
		sum += pool[k];
	}

	for (k in pool){
		var randNum = Math.random()*sum;
		if (randNum < pool[k]){
			return k;
		}
		sum -= pool[k];
	}
}



function initResult(pool){
	result = {};
	for(k in pool){
		result[k] = 0;
	}
	return result;
}


exports.scratch = function(userId,callback){


	var config = scratchConfig;
	var gameDb = scratch;
/*
	console.log(scratchConfig);
	console.log(config);

	var time = 100000;

	var result = initResult(config.pool);

	for (var i=0; i<time; i++){
		var k = draw(config.pool);
		result[k]++;
	}

	var total = 0;

	for(k in result){
		console.log(k,result[k]);
		total += k*result[k];
	}

	console.log(total,time*config.base,total/(time*config.base));

*/
	account.findOne({user_id:userId},function(e,o){
		if(e){
			callback('access database error '+e,0);
		}else if(!o){
			callback('User is not existing.',0);
		}else{
			if(o.coin==undefined ||  o.coin < config.base){
				callback('no enough zeen',0);
			}else{
				var coins = parseInt(draw(config.pool));
				var balance = o.coin - config.base + coins;
				account.update({user_id:userId},{$set:{coin:balance},$inc:{total_coin:coins}},{w:1},function(e,o){
					if(e){
						callback('update account error '+e ,0);
					}else{
						UT.log(userId,'earn','scratch',coins,config.base);
						gameDb.insert({user_id:userId,coin:coins,time:moment().unix()},{safe:true},function(e){
							if(e){
								callback('write log error',0);
							}else{
								callback(null,{"coins":coins,"happy":(coins>=config.high_value)});
							}
						});

					}
				});
			}
		}
	});
}


exports.slyder = function(userId,callback){


	var config = slyderConfig;
	var gameDb = slyder;
/*
	console.log(scratchConfig);
	console.log(config);

	var time = 100000;

	var result = initResult(config.pool);

	for (var i=0; i<time; i++){
		var k = draw(config.pool);
		result[k]++;
	}

	var total = 0;

	for(k in result){
		console.log(k,result[k]);
		total += k*result[k];
	}

	console.log(total,time*config.base,total/(time*config.base));
*/
	account.findOne({user_id:userId},function(e,o){
		if(e){
			callback('access database error '+e);
		}else if(!o){
			callback('User is not existing.');
		}else{
			if(o.coin==undefined ||  o.coin < config.base){
				callback('no enough zeen');
			}else{
				var coins = parseInt(draw(config.pool));
				var pos = config.postion[coins.toString()];
			//	console.log("xxx",config.postion,coins.toString(),pos);
				var balance = o.coin - config.base + coins;
				account.update({user_id:userId},{$set:{coin:balance},$inc:{total_coin:coins}},{w:1},function(e,o){
					if(e){
						callback('update account error '+e);
					}else{
						UT.log(userId,'earn','slyder',coins,config.base);
						gameDb.insert({user_id:userId,coin:coins,time:moment().unix()},{safe:true},function(e){
							if(e){
								callback('write log error');
					//			console.log('write log error');
							}else{
					//			console.log({"position":pos});
								callback(null,{"position":pos,"coin":coins});
							}
						});

					}
				});
			}
		}
	});
}

exports.lottery = function(userId,callback){
	var config = lotteryConfig;
	var time = moment().unix();
	if(time > moment(config.open_date).unix()){
		callback('this lottery has closed');
		return;
	}

	account.findOne({user_id:userId},function(e,o){
		if(e){
			callback('access database error '+e);
		}else if(!o){
			callback('User is not existing.');
		}else{
			if(o.coin==undefined || o.coin < config.base){
				callback('no enough zeen');
			}else{
				var balance = o.coin - config.base;
				account.update({user_id:userId},{$set:{coin:balance}},{w:1},function(e,o){
					if(e){
						callback('update account error '+e);
					}else{
						rand6(function(code){
						//	UT.log(userId,'earn','lottery',-config.base,'');
							codeDb.insert({no:config.no,user_id:userId,code:code,time:moment().unix()},{safe:true},function(e,o){
							callback(e,"")});
						});
						UT.log(userId,'lottery','',0,config.base);

					}
				});
			}
		}
	});

}

exports.lotteryCount = function(callback){
	var c = lotteryConfig;
	codeDb.count({no:c.no},function(e,o){
		var config = {
			"no":c.no,
			"open_date":c.open_date,
			"base":c.base,
			"winner_num":c.winner_num,
			"count":c.count+o
		};
		callback(e,config);
	});

}

exports.lotteryCode = function(userId,callback){
	codeDb.find({user_id:userId},function(e,docs){
		if(e){
			callback(e,null);
		}else{
			docs.toArray(callback);
		}
	});

}
var lotteryList = null;
function loadLotteryList(reload,callback){
	//console.log(lotteryList,reload,(lotteryList || reload));
	if(!lotteryList || reload){
		lottery.find({},{sort:{time:-1},limit:10},function(e,docs){
			if(e||!docs){
				callback(e,docs);
			}else{
				lotteryList ={};
				docs.toArray(function(e,record){
					record.forEach(function(rec){
						lotteryList[rec.no] = rec;
					});					
				});

				callback(lotteryList);
			}
		});
	}else{
		callback(lotteryList);
	}
}

exports.lotteryOpen = function(callback){
	if(moment().unix() < moment(lotteryConfig.open_date).unix()){
		callback('Lottery is still open.');
	}else{
		lottery.findOne({no:lotteryConfig.no},function(e,o){
			if(o.opened){
				callback('Finished');
			}else{
				codeDb.find({no:lotteryConfig.no},{_id:0,code:1},function(e,cs){
					var winners = [];
					cs.toArray(function(e,codeArray){
						for(var i=0; i< lotteryConfig.winner_num; i++){
							var index = UT.rand(0,codeArray.length);
							winners.push(codeArray[index]);
						}
					//	console.log({no:lotteryConfig.no},{$set:{winner:winners,opened:true}});
						lottery.update({no:lotteryConfig.no},
							{$set:{winner:winners,opened:true}},
							{safe:true},function(e,o){
								callback(e,winners);
							});

					});
				});

				UT.alertAll(alertConfig.lottery_open);
				
			}

		});
	}
}

exports.lotteryCodes = function(userId,page,callback){
	var limit = 20;
	var start = page*limit;
	codeDb.find({user_id:userId},{_id:0},{sort:{time:-1},skip:start,limit:limit},function(e,docs){
		if(e || !docs){
			callback(e,docs);
		}else{
			loadLotteryList(false,function(lotteryList){
				docs.toArray(function(e,codes){
					//console.log("codes:",codes,"\nlolist",lotteryList);
					var ret = [];
					var lastCode="";
					var num = 0;

					codes.forEach(function(code){
					//	console.log(ret);
						if(lastCode!=code.no){
							lastCode = code.no;
							num++;
							ret.push({
								"no":code.no,
								"title":lotteryList[code.no].display.title,
								"winner":lotteryList[code.no].winner,
								"codes":[{"code":code.code,"time":moment(code.time*1000).format('YYYY-MM-DD')}]
							});
						}else{
							ret[num-1].codes.push({"code":code.code,"time":moment(code.time*1000).format('YYYY-MM-DD')});
						}

					});
					callback(e,ret);
				});
			});
		}
	});

}


exports.getGameDesc = function(callback){
	callback(null,{
		'lottery':lotteryConfig.display,
		'scratch':scratchConfig.display,
		'slyder':slyderConfig.display,
		'new_game':newGameConfig.display
		});



}
