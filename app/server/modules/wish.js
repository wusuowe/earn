var UT        = require('./utility');
var ObjectID = require('mongodb').ObjectID;
var db = require('./database').db;
var account = db.collection('account');
exports.recordWish = function(userId,desc,callback){
	wishDb.findOne({user_id:userId,status:{$in:['create','confirm']}},function(e,o){
		if(e){
			callback(e);
		}else if(!o){
			wishDb.insert({user_id:userId,desc:desc,status:'create'},function(e,o){
				if(e){
					callback(e);
				}else{
					getCurWish(userId,callback);
				}
			});
		}else{
			callback('You already made a wish.');
		}
	});
}


getCurWish= function(userId,callback){
	wishDb.findOne({user_id:userId,status:{$in:['create','confirm']}},function(e,o){
		if(e || !o ){
			callback(e,"");
		}else{
			callback(null,o);
		}
	});
}
exports.getWish = function getWishDetail(userId,callback){
	getCurWish(userId,function(e,o){
		var detail = [o.desc];
		var wish = systemConfig.wish_detail;
//		detail.unshift(o.desc);
	//	console.log(detail);
	//	console.log(systemConfig);
		if(o.status == 'confirm'){
			detail.push(wish[0].replace("#PRICE#",o.price).replace("#FREIGHT#",o.freight));
			detail.push(wish[1].replace("#COIN#",o.coin).replace("#DISCOUNTED#",o.coin/systemConfig.rate));
		}
		o.desc = detail;
		o.coin = o.coin + o.freight;
		delete o["price"];
		delete o["freight"];
		delete o["_id"];
		callback(e,o);
	});	
}

exports.getWishList = function(status,page,callback){
	var limit = 20;
	var start = limit * page;
	var query = (status == null)?{}:{status:status};
	wishDb.find(query,{skip:start,limit:limit},function(e,o){
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


exports.confirmWish = function(id,price,discount,freight,callback){
	wishDb.findOne({_id:ObjectID.createFromHexString(id),status:'create'},function(e,o){
		if(e||!o){
			callback('no wished gift under reviewing');
		}else{
			var fPrice = parseFloat(price);
			console.log(fPrice,systemConfig.rate,discount);
			var iCoin  = fPrice * systemConfig.rate * parseFloat(discount) / 10.0;
			var iFreight = parseFloat(freight) * systemConfig.rate;
			wishDb.update({user_id:o.user_id,status:'create'},
				{$set:{status:'confirm',price:fPrice,coin:Math.round(iCoin),freight:Math.round(iFreight)}},
				{w:1},callback);
			UT.alertUser(o.user_id,alertConfig.wish_pass);
		}
	});
}

exports.deleteWish = function(user_id,callback){
	wishDb.update({user_id:user_id,status:{$in:['create','confirm']}},{$set:{status:'delete'}},function(e,o){
		if(e){
			callback(e);
		}else{
			getCurWish(user_id,callback);
		}

	});
}


exports.deleteWishById = function(id,callback){
	wishDb.update({_id:ObjectID.createFromHexString(id),status:{$in:['create','confirm']}},{$set:{status:'delete'}},callback);
}

exports.exchangeWish = function(user_id,callback){
	wishDb.findOne({user_id:user_id,status:'confirm'},function(e,o){
		if(e||!o){
			callback('confirmed wished gift unfound');
		}else{
			account.update({user_id:o.user_id,coin:{$gte:o.coin}},{$inc:{coin:-o.coin}},{w:1},function(e,o){
				if(e || !o){
					callback('wished gift unfound or no enough zeen');
				}else{
					wishDb.update({user_id:user_id,status:'confirm'},{$set:{status:'exchange'}},function(e,o){
						if(e){
							callback(e);
						}else{
							getCurWish(user_id,callback);
						}

					});
				}

			});
		}
	});
}

exports.completeWish = function(id,callback){
	wishDb.update({_id:ObjectID.createFromHexString(id)},{$set:{status:'complete'}},callback);
}




