var crypto      = require('crypto');
var MongoDB     = require('mongodb').Db;
var Server      = require('mongodb').Server;
var moment      = require('moment');
var UT      = require('./utility');

var ST = require('./setting');
var dbPort      = ST.dbPort;
var dbHost      = ST.dbHost;
var dbName      = ST.dbName;
var devServerSecret = ST.devServerSecret;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
var scratchFile = 'config/scratch-off.json';
var slyderFile = 'config/slyder.json';
var lotteryFile = 'config/lottery.json';


db.open(function(e, d){
	if (e) {
		console.log(e);
	}   else{
		console.log('connected to database :: ' + dbName);
	}
});

var scratch = db.collection('scratch');
var account = db.collection('account');
var slyder = db.collection('slyder');
var lottery = db.collection('lottery');

var scratchConfig;
//var slyderConfig;
var lotteryConfig;

loadScratchConfig(scratchFile,function(e,o){});
loadSlyderConfig(slyderFile,function(e,o){});
loadLotteryConfig(lotteryFile,function(e,o){});

function loadScratchConfig(filename,callback){
	var fs = require('fs');
	var file = __dirname +'/' +filename;

	fs.readFile(file, 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			callback(err,null);
		}else{
			var config = JSON.parse(data);
			preProcessPool(config);
			scratchConfig = config;
			console.log(scratchConfig);	
			callback(null,null);
		}
	});
}


function loadSlyderConfig(filename,callback){
	var fs = require('fs');
	var file = __dirname +'/' +filename;

	fs.readFile(file, 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			callback(err,null);
		}else{
			var config = JSON.parse(data);
			preProcessPool(config);
			slyderConfig = config;		
			console.log(slyderConfig);
			callback(null,null);
		}
	});
}

function loadLotteryConfig(filename,callback){
	var fs = require('fs');
	var file = __dirname +'/' +filename;

	fs.readFile(file, 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			callback(err,null);
		}else{
			var config = JSON.parse(data);
			lotteryConfig = config;
			console.log(lotteryConfig);
			callback(null,null);
		}
	});
}


var rnd = function(start, end){
	    return Math.floor(Math.random() * (end - start) + start);
};

var rand = function(callback){
	var n = rnd(10000000,100000000);
	lottery.findOne({code:n},function(e,o){
		if(o){
			rand(callback);
		}else{
			callback(n);
		}
	});

}


function calcMinNum(base,pool,ratio,min){
	var sum = 0;
	var num = 0;
	for (k in pool){
		sum += k * pool[k];
		num += pool[k];
	}
	if (sum / num > base){
		return Math.ceil((sum-ratio*base*num)/(ratio*base-min));
	}else{
		return 0;
	}

}

function preProcessPool(config){
	config.pool[config.min] = calcMinNum(config.base,config.pool,config.ratio,config.min);
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


exports.reloadScratchConfig = function(callback){
	loadScratchConfig(scratchFile,callback);
}

exports.reloadSlyderConfig = function(callback){
	loadSlyderConfig(slyderFile,callback);
}

exports.reloadLotteryConfig = function(callback){
	loadLotteryConfig(lotteryFile,callback);
}
exports.scratch = function(userId,callback){


	var config = scratchConfig;
	var gameDb = scratch;

	account.findOne({user_id:userId},function(e,o){
		if(e){
			callback('access db error '+e,0);
		}else if(!o){
			callback('no user found',0);
		}else{
			if(o.coin==undefined ||  o.coin < config.base){
				callback('no enough coin',0);
			}else{
				var coins = parseInt(draw(config.pool));
				var balance = o.coin - config.base + coins;
				account.update({user_id:userId},{$set:{coin:balance},$inc:{total_coin:coins}},{w:1},function(e,o){
					if(e){
						callback('update account error '+e ,0);
					}else{
						UT.log(userId,'earn','scratch',-config.base,coins);
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
			callback('access db error '+e,0);
		}else if(!o){
			callback('no user found',0);
		}else{
			if(o.coin==undefined ||  o.coin < config.base){
				callback('no enough coin',0);
			}else{
				var coins = parseInt(draw(config.pool));
				var pos = config.postion[coins.toString()];
				var balance = o.coin - config.base + coins;
				account.update({user_id:userId},{$set:{coin:balance},$inc:{total_coin:coins}},{w:1},function(e,o){
					if(e){
						callback('update account error '+e ,0);
					}else{
						UT.log(userId,'earn','slyder',-config.base,coins);
						gameDb.insert({user_id:userId,coin:coins,time:moment().unix()},{safe:true},function(e){
							if(e){
								callback('write log error',0);
							}else{
								callback(null,{"position":pos});
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

	account.findOne({user_id:userId},function(e,o){
		if(e){
			callback('access db error '+e,0);
		}else if(!o){
			callback('no user found',0);
		}else{
			if(o.coin==undefined || o.coin < config.base){
				callback('no enough coin',0);
			}else{
				var balance = o.coin - config.base;
				account.update({user_id:userId},{$set:{coin:balance}},{w:1},function(e,o){
					if(e){
						callback('update account error '+e ,0);
					}else{
						rand(function(code){
							UT.log(userId,'earn','lottery',-config.base,'');
							lottery.insert({no:config.no,user_id:userId,code:code,open_date:moment(config.open_date).unix()},{safe:true},function(e){
								if(e){
									callback('write log error',0);
								}else{
									callback(null,code);
								}
							});
						});

					}
				});
			}
		}
	});

}

exports.lotteryCount = function(callback){
	var config = lotteryConfig;
	lottery.count({no:config.no},function(e,o){
		if(e || !o){
			config.count = 0;
		}else{
			config.count = o;
		}
		callback(e,config);
	});

}

exports.lotteryCodes = function(userId,callback){
	lottery.find({user_id:userId},function(e,docs){
		if(e){
			callback(e,null);
		}else{
			docs.toArray(callback);
		}
	});

}

exports.getGameDesc = function(callback){
	var config = {
		'lottery':lotteryConfig.display,
		'scratch':scratchConfig.display,
		'slyder':slyderConfig.display
	};
	callback(null,config);
}
