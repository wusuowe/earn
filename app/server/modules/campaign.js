var UT = require('./utility');
var db = require('./database').db;
var moment = require('moment');
var CM = {};
module.exports = CM;
var camp = db.collection('campaign');
var request = require('request');

var postback = function(url){
	request(url, function(error, response, body){
		if (!error && response.statusCode == 200) {
			console.log('send postback:'+url) 
		}else{
			console.log(response.headers);
		}

	});
}

CM.recordClick = function(deviceId,vendor,ip){
	camp.findOne({device_id:deviceId},function(e,o){
		var time = moment().unix();
		if(e || !o){
			camp.insert({device_id:deviceId,vendor:vendor,ip:ip,time:time},{safe:true},function(e,o){
				console.log("campaign: ",vendor, "import",deviceId);
			});
		}else{
			console.log('campaign:',deviceId,"has imported before");
		}
	});
}

CM.recordConvert = function(deviceId,userId){
	postback('http://api.altamob.com/conv.json?tid='+deviceId);
	camp.findOne({device_id:deviceId},function(e,o){
		if(e || !o){
		}else{
			var time = moment().unix();
			camp.update({device_id:deviceId},{set:{user_id:userId,convert_time:time}},function(e,o){
			});
		}
	});
}
