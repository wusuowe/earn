var UT = require('./utility');
var db = require('./database').db;
var moment = require('moment');
var eventproxy = require('eventproxy');
var STAT = {};
module.exports = STAT;
var account = db.collection('account');
var logger = db.collection('logger');
var score = db.collection('score');
var campaign = db.collection('campaign');

STAT.summary = function(callback){
	var ep = new eventproxy();
	ep.all('total_user_num','today_inc_user','today_act_user','total_offer_num','today_offer_num','total_click_num','today_click_num',function(total_user_num,today_inc_user,today_act_user,total_offer_num,today_offer_num,total_click_num,today_click_num){
		callback({
			usr:{
				'total_num':total_user_num,'today_increment':today_inc_user,'today_active':today_act_user
			},
			offer:{
				'total_num':total_offer_num,'today_increment':today_offer_num
			},
			campaign:{
				'total_num':total_click_num,'today_increment':today_click_num
			}

		});
	});
	var today = moment(0,'H').unix();
	account.count({},function(e,c){
		ep.emit('total_user_num',c);
	});
	account.count({create_time:{$gte:today}},function(e,c){
		ep.emit('today_inc_user',c);
	});
	account.count({last_login:{$gte:today}},function(e,c){
		ep.emit('today_act_user',c);
	});
	logger.count({type:"earn",sub_type:"ad"},function(e,c){
		ep.emit('total_offer_num',c);
	});
	logger.count({time:{$gte:today},type:"earn",sub_type:"ad"},function(e,c){
		ep.emit('today_offer_num',c);
	});
	campaign.count({},function(e,c){
		ep.emit('total_click_num',c);
	});
	campaign.count({time:{$gte:today}},function(e,c){
		ep.emit('today_click_num',c);
	});


}
STAT.getUserList = function(q,callback){
	var query = {};
	var pageSize = 15;
	var start = pageSize*q.page;
	
	if(q.create_start_time && q.create_start_time !=''){
		query.create_time = {$gte:parseInt(q.create_start_time )};
	}

	if(q.active_start_time && q.active_start_time !=''){
		query.last_login = {$gte:parseInt(q.active_start_time )};
	}

	if(q.ask_code && q.ask_code !=''){
		query.ask_code = q.ask_code;
	}

	account.find(query,{_id:0,user_id:1,coin:1,status:1,pupil_num:1,location:1,last_login:1,client_ip:1},{sort:{last_login:-1},skip:start,limit:pageSize},function(e,o){
		o.toArray(function(e,a){
			a.forEach(function(user){
				user.status = (user.status==-1)?"禁用":"正常";
				user.last_login = moment(user.last_login*1000).format("YYYY-MM-DD HH:mm:ss");
				user.location = user.location||user.client_ip;
			});
			callback(e,a);
		});
	});

}

STAT.getOfferList = function(userId,platform,startTime,endTime,page,callback){
	var pageSize = 15;
	var start = pageSize*page;
	var query = {};
	if(userId && userId!=''){
		query.fd_user = userId;
	}
	if(platform && platform != ''){
		query.platform = platform;
	}
	if(startTime && startTime!=''){
		query.fd_time = {$gte:parseInt(startTime)};
	}
	if(endTime && startTime != ''){
		query.fd_time = {$lt:parseInt(endTime)};
	}
	console.log(query);
	score.find(query,{sort:{fd_time:-1},skip:start,limit:pageSize},function(e,o){
		if(e || !o){
			callback(e||o);
		}else{
			o.toArray(function(e,a){
				a.forEach(function(score){
					score.fd_time = moment(score.fd_time*1000).format("YYYY-MM-DD HH:mm:ss");
				});
				callback(null,a);
			});
		}
	});

}

STAT.getUserDetail = function(userId,callback){
	account.findOne({user_id:userId},function(e,detail){
		if(e || !detail){
			callback('this user does exist');
		}else{
			detail.last_login=moment(detail.last_login*1000).format("YYYY-MM-DD HH:mm:ss");
			detail.create_time=moment(detail.create_time*1000).format("YYYY-MM-DD HH:mm:ss");
			detail.location = detail.location||detail.client_ip;
			detail.create_sum = 0;
			detail.sign_time = 0; 
			detail.share_time = 0; 
			detail.game_time = 0;
			detail.game_cost = 0;
			detail.game_sum = 0;
			detail.recruit_sum = 0;
			detail.rebate_time = 0;
			detail.sign_sum = 0;
			detail.share_sum = 0;
			detail.rebate_sum = 0;
			detail.offer_time = 0;
			detail.offer_sum = 0;
			detail.pupil_earn_time = 0;
			detail.pupil_earn_sum = 0;
			detail.exchange_time = 0;
			detail.exchange_sum = 0;
			detail.lottery_time = 0;
			detail.lottery_cost = 0;
			
			logger.find({user_id:userId},function(e,l){
				l.toArray(function(e,a){
					a.forEach(function(o){
						if(o.type == 'earn'){
							if(o.sub_type == 'create user'){
								detail.create_sum += o.coin;
							}else if(o.sub_type == 'sign'){
								detail.sign_time += 1;
								detail.sign_sum += o.coin;
							}else if(o.sub_type == 'slyder' || o.sub_type=='scratch'){
								detail.game_time += 1;
								detail.game_cost += o.note;
								detail.game_sum  += o.coin;
							}else if(o.sub_type == 'share'){
								detail.share_time +=1;
								detail.share_sum  += o.coin;
							}else if(o.sub_type == 'ad'){
								detail.offer_time += 1;
								detail.offer_sum  += o.coin;
							}else if(o.sub_type == 'recruit'){
								detail.recruit_sum += o.coin;
							}	
						}else if(o.type == 'share'){
								detail.pupil_earn_time += 1;
							detail.pupil_earn_sum += o.coin;
						}else if(o.type == 'exchange'){
							detail.exchange_time +=1;
							detail.exchange_sum  -=o.coin;
						}else if(o.type == 'lottery'){
								detail.lottery_time +=1;
								detail.lottery_cost += o.note
							}

					});
					callback(e,detail);
				});

			});
		}
	});
}
