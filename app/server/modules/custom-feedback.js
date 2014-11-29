var db = require('./database').db;
var moment = require('moment');
var feedback = db.collection('feedback');

exports.saveFeedback = function(userId,post,leader,callback){
	feedback.insert({user_id:userId,post:post,leader:leader,created:moment().unix()},function(e,o){
		callback(e,"save a feedback successfully");
	});
}
exports.listFeedback = function(userId,callback){
	console.log({user_id:userId});
	feedback.find({user_id:userId},{sort:{created:-1}},function(e,o){
		if(e){
			callback(e);
		}else{
			o.toArray(callback);
		}
	});
}

