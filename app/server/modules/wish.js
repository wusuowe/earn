var UT        = require('./utility');

exports.recordWish = function(userId,desc,callback){
	wishDb.findOne({user_id:userId,status:{$in:['create','confirm']}},function(e,o){
		if(e){
			callback(e);
		}else if(!o){
			wishDb.insert({user_id:userId,desc:desc,status:'create'},callback);
		}else{
			callback('exist uncompleted wish');
		}
	});
}

exports.getWish = function(userId,callback){
	wishDb.findOne({user_id:userId,status:{$in:['create','confirm']}},callback);
}

exports.getWishList = function(status,callback){
	var query = {status:status};
	if (!status){
		query = {};
	}
	wishDb.find(query,function(e,o){
		if(e || !o){
			callback(e);
		}else{
			o.toArray(callback);
		}
	});
}


exports.confirmWish = function(userId,price,callback){
	wishDb.findOne({user_id:userId,status:'create'},function(e,o){
		if(e||!o){
			callback('no wish found');
		}else{
			wishDb.update({user_id:userId,status:'create'},{$set:{status:'confirm',price:price}},{w:1},callback);
		}
	});
}

exports.deleteWish = function(id,callback){
	wishDb.update({_id:ObjectId(id)},{$set:{status:'delete'}},callback);
}

exports.exchangeWish = function(userId,callback){
	wishDb.findOne({user_id:userId,status:'confirm'},function(e,o){
		if(e||!o){
			callback('no confirmed wish');
		}else{
			account.update({user_id:userId,coin:{$gte:o.price}},{$inc:{coin:-o.price},$set:{status:'exchange'}},{w:1},function(e,o){
				if(e || !o){
					callback('no wish found or has not enough coin');
				}else{
					callback(e,o);
				}

			});
		}
	});
}

exports.completeWish = function(id,callback){
	wishDb.update({_id:ObjectId(id)},{$set:{status:'complete'}},callback);
}




