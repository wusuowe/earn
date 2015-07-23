var moment      = require('moment');
var ST = require('./setting');
var NT = require('./notify');
var MSG = require('./message');
var crypto 		= require('crypto');
var ICVL  = require('iconv-lite');
var database = require('./database');
var db = database.db;
var lottery = db.collection('lottery');
var logger = db.collection('logger');
var login = db.collection('login');
var survey = db.collection('survey');
var configDb = db.collection('config');
var exchangeDb = db.collection('exchange');
var accountDb = db.collection('account');
var activityDb = db.collection('activity');
var ObjectID = require('mongodb').ObjectID;
var schedule = require("node-schedule");
var request = require('request');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
exports.getRandId= function(collection,field,callback){

	var n = rnd(10000000,100000000).toString();
	collection.findOne({field:n},function(e,o){
		if(o){
			rand(collection,field,callback);
		}else{
			callback(n);
		}
	});
}

exports.initRunEnviroment=function(callback){
	loadConfig(CONFIG,function(e,o){
		console.log("load globe config");
		database.initDb(function(){
			initNewLottery(callback);
		});
});


};

var rnd = function(start, end){
	    return Math.floor(Math.random() * (end - start) + start);
};

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


exports.rand = rnd;
var initNewLottery = function(callback){
	lottery.findOne({no:lotteryConfig.no},function(e,o){
	//	console.log({no:lotteryConfig.no},o,(e ||!o));
		if(e ||!o){
			lotteryConfig.time = moment(lotteryConfig.open_date).unix();

			lottery.insert(lotteryConfig,{safe:true},function(e,o){
				callback();
				console.log("init lottery in db:",lotteryConfig,e);
			});	

		}else{
		callback();
		}
	
	});
}

exports.initNewLottery = initNewLottery;


var loadConfig= function(filename,callback){
	var fs = require('fs');
	var file = __dirname +'/' +filename;

	fs.readFile(file, 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			callback(err,null);
		}else{
			var config = JSON.parse(data);
//			console.log(config);
			prizeConfig = config.prize[LANG];	
			lotteryConfig = config.lottery[LANG];
			scratchConfig = config.scratch[LANG];
			preProcessPool(scratchConfig);
			slyderConfig = config.slyder[LANG];
			preProcessPool(slyderConfig);
			shareConfig = config.share;
			exchangeConfig = config.exchange[LANG];
			subtypeConfig = config.record_subtype[LANG];
			shareRatioConfig = config.share_ratio;
			systemConfig = config.system[LANG];
			newGameConfig = config.new_game;
			alertConfig = config.alert[LANG];
			versionConfig = config.version[LANG];
			levelConfig = config.upgrade[LANG];
			offerWallConfig = config.offerwall[LANG];
			earnConfig = config.earn;
			callback(null,null);
		}
	});
}
exports.loadConfig= loadConfig;
var log = function(userId,type,subType,coin,note){
	logger.insert({user_id:userId,type:type,sub_type:subType,coin:coin,note:note,time:moment().unix(),date:moment().format('YYYY-MM-DD')},function(e,o){
		console.log("log",userId,type,subType,coin,note);
	});
}
exports.log = log;
exports.getExchangeList = function(status,page,callback){
	var limit = 20;
	var start = limit * page;
	var query = (status == null)?{}:{status:status};
	exchangeDb.find(query,{sort:{date:1},skip:start,limit:limit},function(e,o){
		if(e || !o){
			callback(e);
		}else{
			o.toArray(function(e,o){
				o.forEach(function(i){
					i._id = i._id.toHexString();
				});
				callback(e,o);
			}); 
		}
	});
}

exports.completeExchange = function(id,callback){
	exchangeDb.findOne({_id:ObjectID.createFromHexString(id),status:"create"},function(e,o){
		if(e || !o){
			callback('no created exchange found!');
		}else{
			alertUser(o.user_id,alertConfig.exchange);
			exchangeDb.update({_id:ObjectID.createFromHexString(id),status:"create"},{$set:{status:"complete"}},function(e,r){
				var rebateCoin = o.cost * o.rebate; 
				accountDb.update({user_id:o.user_id},{$inc:{coin:rebateCoin},$set:{new_income:1}},callback);
				log(o.user_id,'earn','rebate',rebateCoin,o.sub_type);

			});
		}
	});
}

exports.deleteExchange = function(id,callback){
	exchangeDb.update({_id:ObjectID.createFromHexString(id),status:"create"},
		{$set:{status:"delete"}},callback);
}

exports.getIpList = function(userId,ip,page,callback){
	var limit = 20;
	var start = page*20;
	var query = {};
	if(ip){
		query.ip = RegExp(ip.replace(/\./g,'\\.').replace(/\.[\d]+$/,"..*"));
	}
	if(userId){
		query.user_id = userId;
	}

	login.find(query,{sort:{ip:1},skip:start,limit:limit},function(e,o){
		o.toArray(callback);
	});
}
exports.getRecord = function(userId,type,subType,page,callback){
	var limit = 20;
	var start = page*20;
	var query = {user_id:userId};
	if (type){
		query["type"] = type;
	}
	if(subType){
		query["sub_type"] = subType;
	}

	if(type == 'earn'){
		accountDb.update({user_id:userId},{$set:{new_income:0}},function(e,o){});
	}
	logger.find(query,{sort:{time:-1},skip:start,limit:limit},function(e,docs){
		if(e){
			callback(e);
		}else{
			var curtime = moment();
			docs.toArray(function(e,o){
				o.forEach(function(e){
					if(e.coin>=0){
						e.coin = "+"+e.coin;
					}
					if(type=='share'){
						e.sub_type = e.note;
					}else if(type=="exchange"){
						if(subtypeConfig[e.sub_type]){
							e.sub_type = subtypeConfig[e.sub_type].replace("#NUM#",e.note);
						}

					}else if(subtypeConfig[e.sub_type]){
						var t = e.sub_type;
						e.sub_type = subtypeConfig[t];
						if(t=='ad'){
							e.sub_type += ":" +e.note;
						}
					}
					e.time = moment(e.time*1000).format('YYYY-MM-DD HH:mm');

					
				});
				callback(e,o);
			});
		}
	});
}

var lastQueryTime = 0;
exports.getLatestRecord = function(callback){
	if((moment().unix()-lastQueryTime) > ST.recordQueryInterval){
		logger.find({type:'exchange'},{sort:{time:-1},limit:5},function(e,docs){
			if(e){
				callback(e);
			}else{
				docs.toArray(function(e,o){
					if(e){
						callback(e);
					}else{
						lastQueryTime = moment().unix();
						o.forEach(function(rec){
							rec.elaspe_time = lastQueryTime-rec.time;
						});
						latestRecord = o;
						callback(e,o);
					}
				});
			}
		
		});
	}else{
		callback(null,latestRecord);
	}
}

var lastQueryMsgTime = 0;
exports.getLatestMessage = function(callback){
	if((moment().unix()-lastQueryMsgTime) > ST.recordQueryInterval){
		latestMessage = {system:systemConfig.message};
		type2Name = getExType2Name();
		logger.find({type:'exchange'},{sort:{time:-1},limit:5},function(e,docs){
			if(e){
				callback(e);
			}else{
				docs.toArray(function(e,o){
					if(e){
						callback(e);
					}else{
						
						lastQueryMsgTime = moment().unix();
						o.forEach(function(rec){
							// rec.elaspe_time = lastQueryMsgTime-rec.time;
							// rec.sub_type = type2Name[rec.sub_type];
							latestMessage.system += " " + moment(rec.time*1000).fromNow()
							+ " " + rec.user_id + " redeemed $" + rec.note 
							+ " " + type2Name[rec.sub_type] +".  " ;
						});

						latestMessage.exchange = [];
						callback(e,latestMessage);
						
					}
				});
			}
		
		});
	}else{
		callback(null,latestMessage);
	}
}

exports.md5 = function(str) {
	str = ICVL.encode(str, 'utf8');
	return crypto.createHash('md5').update(str).digest('hex');
}

exports.sha1 = function(str){
	str = ICVL.encode(str, 'utf8');
	return crypto.createHash('sha1').update(str).digest('hex');
}
exports.hmac = function(str,key){
	str = ICVL.encode(str, 'utf8');
	console.log(str,key);
	hmac = crypto.createHmac('sha1',key);
	hmac.update(str);
	hmac.digest('base64');
	return crypto.createHmac('sha1',key).update(str).digest('base64');
}

exports.hmacMD5 = function(str,key){
	str = ICVL.encode(str, 'utf8');
	return crypto.createHmac('md5',key).update(str).digest('hex');
}

exports.getExhangeRatio = function(){
	var exchangeRatio = {};
	exchangeConfig.forEach(function(item){
		var rule = {};
		item.rule.forEach(function(r){
			var rebate = parseFloat(r.rebate)/100.0;
			rule[r.num.toString()] = {coin:r.coin,rebate:rebate};
		});
		exchangeRatio[item.type] = rule;
	});
	return exchangeRatio;
}

var getExType2Name = function(){
	var exchangeType2Name = {};
	exchangeConfig.forEach(function(item){
	
		exchangeType2Name[item.type] = item.title;
	});
	return exchangeType2Name;
}



exports.setPrizeConfig = function(conf,callback){
	var signArray = [];
	conf.sign.forEach(function(a){
		signArray.push(parseInt(a,10));
	});
	conf.sign = signArray;
	var boss = [];
	for (var i=0; i < conf.boss_num.length; i++){
		boss.push([parseInt(conf.boss_num[i],10),parseFloat(conf.boss_ratio[i])]);
	}
	delete conf['boss_num'];
	delete conf['boss_ratio'];
	conf.boss = boss;
	saveConfig('prize',conf,callback);

}

exports.setKvConfig = function(kvs,callback){
	var newKvConfig = {}
	for(var i = 0; i < kvs.key.length; i++){
		if(kvs.key[i] != ""){
			newKvConfig[kvs.key[i]] = kvs.value[i];
		}
	}
	console.log(newKvConfig);
	saveConfig('kv',newKvConfig,callback);
}

exports.setExchangeConfig = function(conf,callback){
	var rule =[];
	for(var i=0; i< conf.num.length; i++){
		var r={};
		r.num = conf.num[i];
		r.coin = conf.coin[i];
		r.unit = conf.unit[i];
		r.show_pic = (conf.show_pic!=null && conf.show_pic[i] == 'on');
		r.picture = conf.picture[i];
		rule.push(r);
	}
	var newConfig = {
		type:conf.type,
		title:conf.title,
		rule:rule
	};
	var index = parseInt(conf.index);
	configDb.findOne({name:'exchange'},function(e,o){
		var confArray = (e||!o)?exchangeConfig:o.detail;

		confArray[index] = newConfig;

		saveConfig('exchange',confArray,callback);
	});

}

exports.showConfig = function(name,defConfig,callback){
	configDb.findOne({name:name},function(e,o){
		if(e||!o){
			callback(e,defConfig);
		}else{
			callback(e,o.detail);
		}
	});
}

var saveConfig = function(name,conf,callback){
	configDb.update({name:name},
			{name:name,detail:conf},
			{upsert:true},callback);
}


exports.rawurlencode = function(str) {
	var code = "";
	var i = 0;

	str.split(" ").forEach(function(s){
		if(i>0){
			code += "+";
		}
		code += encodeURIComponent(s);
		i=i+1;
	});
	
	return code;	
}
exports.broadcast = function(message){
	systemConfig.message = message;

}
var alertAll = function(message){
	var androidPushed = false;
	accountDb.find({},{user_id:1,token_id:1,device_id:1,token_id:1},{$sort:{create_time:1}},function(e,rows){
		rows.toArray(function(err,users){
			console.log(users);
			users.forEach(function(user){
				MSG.insertMsg(user.user_id,message,perror);
				if(user.device_id.length == 18 && user.token_id){ //android
					if(!androidPushed){ 
						NT.androidPush(null,"broadcast","You have a message",systemConfig.app_name,message);
						androidPushed = true;
					}
				}else if(user.device_id.length == 36 && user.token_id){ //ios
					NT.applePush(user.token_id,1,message,null);
				}else{
					console.log("No token id or token id error, can not push message to user:"+user.user_id);
				}
			});
		});
	});
}
exports.alertAll = alertAll;

var alertUser = function(userId,message){
	accountDb.findOne({user_id:userId},{user_id:1,token_id:1,device_id:1,token_id:1},function(e,user){
		console.log(e+":"+user+":"+(!e && user))
		if(!e && user){
			MSG.insertMsg(user.user_id,message,perror);
			if(user.device_id.length == 18 && user.token_id){ //android
				NT.androidPush(user.token_id,"unicast","You have a message",systemConfig.app_name,message);
			}else if(user.device_id.length == 36 && user.token_id){ //ios
				NT.applePush(user.token_id,1,message,null);
			}else{
				console.log("No token id or token id error, can not push message to user:"+userId);
			}
		}
	});
		
}
exports.alertUser = alertUser;
var alertUserLogin= function(){
	var now = moment().unix();
	var minTime = now - 3600*73;
	var maxTime = now - 3600*72;
	accountDb.find({last_login:{$gte:minTime,$lte:maxTime}},{user_id:1,token_id:1,device_id:1,token_id:1},function(e,o){
		o.toArray(function(e,a){
			a.forEach(function(user){alertConfig.login
				alertUser(user.user_id,alertConfig.login);	
			});
		});
	});
}

var loginDetect = function(){
	var rule = new schedule.RecurrenceRule();
	//rule.minute = 40;
	rule.minute = 0;
	var j = schedule.scheduleJob(rule, function(){
		alertUserLogin();
		console.log("Send login alert");
	});
}

loginDetect();

exports.ip2location = function(ip,callback){
	var url = "http://www.ip138.com/ips1388.asp?ip="+ip+"&action=2";
	fetchContent(url,function(data){
		var rst = data.toString().match(/本站主数据：[^<]*/);
		if(rst){
			callback(null,rst[0].replace(/本站主数据：/,''));
			console.log(ip,"-->",rst[0].replace(/本站主数据：/,''));
		}else{
			callback(null,'');
		}
	});

}


function fetchContent(url,callback){
	var req = request(url, {timeout: 10000, pool: false});
	req.setMaxListeners(50);

	req.on('error', function(err) {
		console.log(err);
	});
	req.on('response', function(res) {
		var bufferHelper = new BufferHelper();
		res.on('data', function (chunk) {
			bufferHelper.concat(chunk);
		});
		res.on('end',function(){
			var result = iconv.decode(bufferHelper.toBuffer(),'GBK');
			callback(result);
		});
	});
}
exports.checkAnswer = function(userId,answer,callback){
	survey.findOne({user_id:userId,survey_no:'xxxxx'},function(e,o){
		if(o){
			callback("You have completed before");
		}else{
			var coin = 0;
			var answers = answer.split(",");
			for(var i in answers){
				if(parseInt(answers[i]) == earnConfig.surver_answer[i]){
					coin += earnConfig.survey.problems[i].score;
				}else{
					break;
				}
			};
			survey.insert({user_id:userId,survey_no:'xxxxx',answer:answer},function(e,o){});
			accountDb.update({user_id:userId},{$inc:{coin:coin}},function(e,o){});
			callback(null,"You get "+coin+" coins");
		}
	});
	
}
exports.logActivity = function(userId,u){
	activityDb.findOne({user_id:userId},function(e,o){
		if(e || !o){
			activityDb.insert({user_id:userId,info:0,login:0,share:0,zeens:0,friends:0},function(e,o){
				activityDb.update({user_id:userId},u,function(e,o){
					if(e){
						console.log('log activity:',e);
					}
				});
			});
		}else{
			activityDb.update({user_id:userId},u,function(e,o){
				if(e){
					console.log('log activity:',e);
				}
			});
		}
	});
}


var perror =function(e,o){
	if(e){
		console.log("error:",e);
	}
}
exports.printError = perror;