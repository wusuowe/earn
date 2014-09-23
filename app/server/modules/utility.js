var moment      = require('moment');
var ST = require('./setting');
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

var rnd = function(start, end){
	    return Math.floor(Math.random() * (end - start) + start);
};

exports.loadPrizeConfig= function(filename,callback){
	var fs = require('fs');
	var file = __dirname +'/' +filename;

	fs.readFile(file, 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			callback(err,null);
		}else{
			prizeConfig = JSON.parse(data);
			console.log(prizeConfig);	
			callback(null,null);
		}
	});
}

exports.loadExchangeConfig= function(filename,callback){
	var fs = require('fs');
	var file = __dirname +'/' +filename;

	fs.readFile(file, 'utf8', function (err, data) {
		if (err) {
			console.log('Error: ' + err);
			callback(err,null);
		}else{
			exchangeConfig = JSON.parse(data);
			console.log(exchangeConfig);	
			callback(null,null);
		}
	});
}

exports.log = function(userId,type,subType,coin,note){
	logger.insert({user_id:userId,type:type,sub_type:subType,coin:coin,note:note,time:moment().unix(),date:moment().format('YYYY-MM-DD')},function(e,o){
		console.log("log",userId,type,subType,coin,note);
	});
}

exports.getRecord = function(userId,type,subType,start,limit,callback){
	var query = {user_id:userId};
	if (type){
		query["type"] = type;
	}
	if(subType){
		query["subType"] = subType;
	}
	logger.find(query,{sort:{time:-1},skip:start,limit:limit},function(e,docs){
		if(e){
			callback(e);
		}else{
			docs.toArray(callback);
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
						lastQueryTime = moment.unix();
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
