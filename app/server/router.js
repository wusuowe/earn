var moment = require('moment');
var fs = require('fs');
var GM = require('./modules/game');
var AM = require('./modules/account-manager');
var UM = require('./modules/user-manager');
var UT = require('./modules/utility');
var PB = require('./modules/score-feedback');
var FD = require('./modules/custom-feedback');
var WH = require('./modules/wish');
var CM = require('./modules/campaign');
var STAT = require('./modules/statistic');
var MSG = require('./modules/message');
var UPG = require('./modules/upgrade');

var CT = require('./modules/country-list');

var responseFun = function(res,e,o){
	if(e){
		res.status(200).send({"code":"error","msg":e,"data":""});
	}else{
		res.status(200).send({"code":"ok","msg":"","data":o});
	}

}

module.exports = function(app) {

	app.get('/*', function(req, res,next){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		console.log("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]",ip,req.path);
		console.log(req.query);
		if(ip != '121.42.0.18'){
			next();
		}else{
		     console.log('A sb is attacking us ...');
			 res.status(200).send("sb,fuck you mother");
		}
	});
	
	app.post('/*', function(req, res,next){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		console.log("["+moment().format('YYYY-MM-DD HH:mm:ss')+"]",ip,req.path);
		console.log(req.body);
		if(ip != '121.42.0.18'){
			next();
		}else{
		     console.log('A sb is attacking us ...');
			 res.status(200).send("sb,fuck you mother");
			
		}

	});

	app.post('/exchange',function(req,res){
		AM.exchange(req.body.user_id,req.body.type,req.body.num,req.body.desc,req.body.text1,req.body.text2,function(e,o){
			responseFun(res,e,o);
		});

	});


	app.get('/campaign/record',function(req,res){
		var device_id = req.query.aff_sub;
		var vendor = 'Neil';
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress; 
		//CM.recordClick(req.query.device_id,req.query.vendor);
		CM.recordClick(device_id,vendor,ip);
		res.redirect('https://play.google.com/store/apps/details?id=com.privateP.makemoney');
		
	});

	app.get('/postback/aarki/android',function(req,res){
		PB.postbackAarki(req.query,"android",function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/aarki/ios',function(req,res){
		PB.postbackAarki(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/dianru/ios',function(req,res){
		PB.postbackDianru(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});
	});

	app.get('/postback/dianru/android',function(req,res){
		PB.postbackDianru(req.query,'android',function(e,o){
			responseFun(res,e,o);	
		});


	});
	
	app.get('/postback/duomeng',function(req,res){
			PB.postbackDuomeng(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/duomeng/android',function(req,res){
			PB.postbackDuomeng(req.query,'android',function(e,o){
			responseFun(res,e,o);	
		});

	});
	
	app.get('/postback/miidi/ios',function(req,res){
		PB.postbackMiidi(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});

	});


	app.get('/postback/miidi/android',function(req,res){
		PB.postbackMiidi(req.query,'android',function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/youmeng/ios',function(req,res){
		PB.postbackYoumeng(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});

	});
	app.get('/postback/youmeng/android',function(req,res){
		PB.postbackYoumeng(req.query,'android',function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/youmi/ios',function(req,res){
		PB.postbackYoumi(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});

	});
	
	app.get('/postback/youmi/android',function(req,res){
		PB.postbackYoumi(req.query,'android',function(e,o){
			responseFun(res,e,o);	
		});

	});
	
	app.get('/postback/limei/ios',function(req,res){
		PB.postbackLimei(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});

	});
	app.get('/postback/limei/android',function(req,res){
		PB.postbackLimei(req.query,'android',function(e,o){
			responseFun(res,e,o);	
		});

	});


	app.get('/postback/coco/android',function(req,res){
		PB.postbackCoco(req.query,'android',function(e,o){
			responseFun(res,e,o);	
		});

	});
	
	app.get('/postback/coco/ios',function(req,res){
		PB.postbackCoco(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/wanpu/android',function(req,res){
		PB.postbackWanpu(req.query,'android',function(e,o){
			if(e){
				res.status(200).send({"message":"无效数据","success":false});
			}else{
				res.status(200).send({"message":"成功接收","success":true});
			}
		
		});

	});

	app.get('/postback/wanpu/ios',function(req,res){
		PB.postbackWanpu(req.query,'ios',function(e,o){
			console.log(e,o);
			if(e){
				res.status(200).send({"message":"无效数据","success":false});
			}else{
				res.status(200).send({"message":"成功接收","success":true});
			}
		});

	});

	app.get('/postback/yijifen/android',function(req,res){

		PB.postbackYijifen(req,'android',function(e,o){
			if(e){
				res.status(200).send({"message":"无效数据","success":false});
			}else{
				res.status(200).send({"message":"成功接收","success":true});
			}
		
		});

	});

	app.get('/postback/yijifen/ios',function(req,res){
		PB.postbackYijifen(req,'ios',function(e,o){
			console.log(e,o);
			if(e){
				res.status(200).send({"message":"无效数据","success":false});
			}else{
				res.status(200).send({"message":"成功接收","success":true});
			}
		});

	});


	app.get('/postback/playerize/ios',function(req,res){
		PB.postbackPlayerize(req.query,'ios',function(e,o){
			if(e){
				res.status(200).send(e);
			}else{
				res.status(200).send(1);
			}	
		});

	});

	app.get('/postback/playerize/android',function(req,res){
		PB.postbackPlayerize(req.query,'android',function(e,o){
			if(e){
				res.status(200).send(e);
			}else{
				res.status(200).send(1);
			}	
		});

	});

	app.get('/postback/nativex/android',function(req,res){
		PB.postbackNativeX(req.query,'android',function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/nativex/ios',function(req,res){
		PB.postbackNativeX(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/tokenads/android',function(req,res){
		PB.postbackTokenads(req.query,'android',function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/tokenads/ios',function(req,res){
		PB.postbackTokenads(req.query,'ios',function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/postback/supersonic/android',function(req,res){
		PB.postbackSuperSonic(req.query,'android',function(e,o){
			if(e){
				res.status(200).send(e);	
			}else{
				res.status(200).send(o);
			}
		});

	});

	app.get('/postback/supersonic/ios',function(req,res){
		PB.postbackSuperSonic(req.query,'ios',function(e,o){
			if(e){
				res.status(200).send(e);	
			}else{
				res.status(200).send(o);
			}
		});

	});
	
	app.get('/postback/trialpay/android',function(req,res){
		PB.postbackTrialpay(req,'android',function(e,o){
			if(e){
				res.status(200).send("1");
				//res.status(400).send(e);	
			}else{
				res.status(200).send("1");
			}
		});

	});

	app.get('/postback/trialpay/ios',function(req,res){
		PB.postbackTrialpay(req,'ios',function(e,o){
			if(e){
				res.status(400).send(e);	
			}else{
				res.status(200).send("1");
			}
		});

	});


	app.get('/postback/fyber',function(req,res){
		PB.postbackFyber(req.query,function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/get/exchange/config',function(req,res){
		console.log(exchangeConfig);
		responseFun(res,null,exchangeConfig);
	});

	app.get('/reload/config',function(req,res){
		UT.loadConfig('config/globe.json',function(e,o){
			responseFun(res,e,o);
		});
	});

	app.post('/insert/message',function(req,res){
		MSG.insertMsg(req.body.user_id,req.body.content,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/message/list',function(req,res){
		MSG.getMsgList(req.query.user_id,req.query.page,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/message/status',function(req,res){
		MSG.getMsgBoxStatus(req.query.user_id,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/delete/message',function(req,res){
		MSG.deleteMsg(req.query.msg_id,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/level',function(req,res){
		UPG.getLevel(req.query.user_id,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/level/detail',function(req,res){
		UPG.getLevelDetail(req.query.user_id,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/bonus',function(req,res){
		AM.getBonus(req.query.user_id,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/bonus/detail',function(req,res){
		AM.getBonusDetail(req.query.user_id,req.query.page,function(e,o){
			responseFun(res,e,o);
		});
	});
	

	app.get('/get/game/desc',function(req,res){
		GM.getGameDesc(function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/latest/message',function(req,res){
		UT.getLatestMessage(function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/latest/record',function(req,res){
		UT.getLatestRecord(function(e,o){
			responseFun(res,e,o);
		});
	});
	
	app.get('/get/lottery',function(req,res){
		GM.lotteryCount(function(e,o){
			responseFun(res,e,o);	
		});

	});
	app.get('/admin/open/lottery',function(req,res){
		GM.lotteryOpen(function(e,o){
			responseFun(res,e,o);
		});
	});

	app.post('/check/update',function(req,res){
		AM.checkUpdate(req.body,function(e,o){
			console.log('xxxx',e,o);
			responseFun(res,e,o);
		});		
	});

	app.get('/get/lotterycodes',function(req,res){
		GM.lotteryCodes(req.query['user_id'],req.query.page,function(e,o){
			responseFun(res,e,o);	
		});

	});
	app.get('/game/lottery',function(req,res){
		GM.lottery(req.query['user_id'],function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/game/scratch',function(req,res){
		GM.scratch(req.query['user_id'],function(e,o){
			responseFun(res,e,o);	
		});

	});
	
	app.get('/game/slyder',function(req,res){
		GM.slyder(req.query['user_id'],function(e,o){
			console.log(o);
			responseFun(res,e,o);	
		});

	});

	app.get('/get/prize/config',function(req,res){
		if(req.query['sub']){
			res.status(200).send({'code':'ok','msg':'','data':prizeConfig[req.query['sub']]});
		}else{
			res.status(200).send({'code':'ok','msg':'','data':prizeConfig});
		}
		

	});

	app.post('/get/record',function(req,res){
		UT.getRecord(req.body.user_id,req.body.type,req.body.subtype,req.body.page,function(e,o){
			responseFun(res,e,o);
		});

	});

	app.get('/get/signinfo',function(req,res){
		AM.getSignInfo(req.query['user_id'],function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/signin',function(req,res){
		AM.signIn(req.query['user_id'],function(e,o){
			responseFun(res,e,o);	
		});

	});
	app.post('/set/askcode',function(req,res){
		AM.setAskCode(req.body.user_id,req.body.ask_code,function(e,o){
			responseFun(res,e,o);
		});

	});

	app.get('/get/share/ratio',function(req,res){
		responseFun(res,null,{
			"recruit":prizeConfig.recruit,
			"share_ratio":shareRatioConfig[LANG]
		});
		

	});
	
	app.get('/ask/friend',function(req,res){
		AM.askFriend(req.query.user_id,req.query.channel,function(e,o){
			 responseFun(res,e,o);
		});		

	});

	app.post('/set/contact',function(req,res){
		var contact = {
			"QQ":req.body.QQ,
			"email":req.body.email,
			"phone":req.body.phone,
			"postcode":req.body.postcode,
			"addr":req.body.addr,
			"name":req.body.name,
			"paypal":req.body.paypal

		};
		AM.setContact(req.body.user_id,contact,function(e,o){
			responseFun(res,e,o);
		});

	});
	app.post('/share',function(req,res){
		AM.share(req.body.user_id,req.body.channel,function(e,o){
			responseFun(res,e,o);
		});

	});


	app.post('/set/tokenid',function(req,res){
		AM.setTokenId(req.body.user_id,req.body.token_id,function(e,o){
			responseFun(res,e,o);
		});

	});

	app.get('/get/coin',function(req,res){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		AM.getCoin(req.query.user_id,ip,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/open/offerwall',function(req,res){
		AM.openOfferWall(req.query.user_id,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/user',function(req,res){
		var userId = req.query['user_id'];
		var deviceId = req.query['device_id'];
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		AM.getUser(deviceId,userId,function(e,o){
			if(e && deviceId){
				AM.createAccount(deviceId,ip,function(e,o){
					if(e){
						responseFun(res,e,o);
					}else{
						AM.getUser(deviceId,userId,function(e,o){
							responseFun(res,e,o);
						});
					}
				});
			}else {
				responseFun(res,e,o);
			}

		});

	});

	app.post('/feedback',function(req,res){
		var leader = (req.body.leader)?req.body.leader:"";
		FD.saveFeedback(req.body.user_id,req.body.post,leader,function(e,o){
			responseFun(res,e,o);
		});
		
	});

	app.get('/get/feedback',function(req,res){
		FD.listFeedback(req.query.user_id,function(e,o){
			responseFun(res,e,o);
		});
	});

	

	app.post('/record/wish',function(req,res){
		WH.recordWish(req.body.user_id,req.body.desc,function(e,o){
			responseFun(res,e,o);
		});
	});
	
	app.get('/get/wish',function(req,res){
		WH.getWish(req.query.user_id,function(e,o){
			responseFun(res,e,o);
		});
	});
	
	app.get('/del/wish',function(req,res){
		WH.deleteWish(req.query.user_id,function(e,o){
			responseFun(res,e,o);
		});
	});
	
	app.get('/get/earn/info',function(req,res){
		responseFun(res,null,earnConfig);
	});

	app.post('/submit/answer',function(req,res){
		UT.checkAnswer(req.body.user_id,req.body.answer,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/exchange/wish',function(req,res){
		WH.exchangeWish(req.query.user_id,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.post('/confirm/wish',function(req,res){
		WH.confirmWish(req.body.id,req.body.price,req.body.discount,req.body.freight,function(e,o){
			responseFun(res,e,o);
		});
	});
	
// creating new users //
	
	app.get('/signup', checkAuth,function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});
	
	app.post('/signup', checkAuth,function(req, res){
		UM.addNewUser({
			name 	: req.param('name'),
			email 	: req.param('email'),
			user 	: req.param('user'),
			pass	: req.param('pass'),
			country : req.param('country')
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});


/*
	app.get('/admin/*',function(req,res,next){
		if(req.session.user == null){
			res.redirect('/admin/login');
		}else{
			next();
		}
	});

	app.post('/admin/*',function(req,res,next){
		if(req.session.user == null){
			res.redirect('/admin/login');
		}else{
			next();
		}
	});
*/
	function checkAuth(req, res, next) {
		if (!req.session.user) {
//			res.send('You are not authorized to view this page');
			res.redirect('/admin/login');
		} else {
			console.log(req.session);
			next();
		}
	}
	app.get('/admin/login', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your User' });
		}	else{
	// attempt automatic login //
			UM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/admin/home');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your User' });
				}
			});
		}
	});
	
	app.post('/admin/login', function(req, res){
		UM.manualLogin(req.body.user, req.body.pass, function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
			    req.session.user = o;
				if (req.param('remember-me') == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.status(200).send(o);
			}
		});
	});
	
	app.get('/admin/ip2location',checkAuth,function(req,res){
		UT.ip2location(req.query.ip,function(e,o){
			res.status(200).send(o);
		});
	});	

	app.get('/admin/statistic',checkAuth,function(req,res){
		STAT.summary(function(o){
			console.log(o);
			res.render('statistic',o);
		});
	});	
	app.get('/admin/user/list',checkAuth,function(req,res){
		if(req.query.create_start_time == 'today'){
			req.query.create_start_time = moment(0,'H').unix();
		}
		if(req.query.active_start_time == 'today'){
			req.query.active_start_time = moment(0,'H').unix();
		}	
		var base = "?create_start_time="+(req.query.create_start_time||'')
		+"&active_start_time="+(req.query.active_start_time||'')
		+"&ask_code="+(req.query.ask_code||'');


		STAT.getUserList(req.query,function(e,o){
			res.render('userlist',{users:o,base:base,page:req.query.page});
		});
	});	
	app.get('/admin/set/user/status',checkAuth,function(req,res){
		AM.setAccountStatus(req.query.user_id,req.query.status,function(e,o){
		res.redirect('/admin/user/detail?user_id='+req.query.user_id);	
		});
	});	

	app.get('/admin/offer/list',checkAuth,function(req,res){
		if(req.query.start_time == 'today'){
			req.query.start_time = moment(0,'H').unix();
		}
		var base =  "?user_id="+(req.query.user_id||'')+"&platform="
		+(req.query.platform||'')+"&start_time="+(req.query.start_time||'')
		+"&end_time="+(req.query.end_time||'');
		STAT.getOfferList(req.query.user_id,req.query.platform,req.query.start_time,req.query.end_time,req.query.page,function(e,o){
			res.render('offerlist',{offers:o,base:base,page:req.query.page});
		});
	});	

	app.get('/admin/user/detail',checkAuth,function(req,res){
		STAT.getUserDetail(req.query.user_id,function(e,o){
			if(e || !o){
				res.status(400).send(e);
			}else{
				res.render('userdetail',{detail:o});
			}
		});
	});	
	app.get('/admin/delete/exchange', checkAuth,function(req, res) {
		UT.deleteExchange(req.query.id,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/admin/complete/exchange', checkAuth,function(req, res) {
		UT.completeExchange(req.query.id,function(e,o){
			responseFun(res,e,o);
		});		
	});

	app.get('/admin/list/exchange', checkAuth,function(req, res) {
		UT.getExchangeList(req.query.status,req.query.page,function(e,o){
			res.render('exchangelist', { exchanges : o,page:req.query.page,status:req.query.status });		
		});
	});
	app.get('/admin/list/login', checkAuth,function(req, res) {
		var base = "?user_id="+(req.query.user_id||'')+"&ip="+(req.query.ip||'');
		UT.getIpList(req.query.user_id,req.query.ip,req.query.page,function(e,o){
			res.render('loginlist', { logins: o,base:base,page:req.query.page});		
		});
	});

	app.get('/admin/list/wish', checkAuth,function(req, res) {
		WH.getWishList(req.query.status,req.query.page,function(e,o){
			res.render('wishlist', { wishes : o,page:req.query.page,status:req.query.status });		
		});
	});
	app.get('/admin/del/wish',function(req,res){
		WH.deleteWishById(req.query.id,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.post('/admin/refuse/wish',function(req,res){
		WH.refuseWish(req.body.id,req.body.reason,function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/admin/push/message',function(req,res){
		res.render('messageservice');
	});
	app.post('/admin/push/message',checkAuth,function(req,res){
		if(req.body.user_id){
			UT.alertUser(req.body.user_id,req.body.message);
		}else{
			UT.alertAll(req.body.message);
		}
		res.render('messageservice');
	});
	app.post('/admin/broadcast',checkAuth,function(req,res){
		UT.broadcast(req.body.message);
		res.render('messageservice');
	});


	app.get('/admin/exchange/config', checkAuth,function(req, res) {
		UT.showConfig('exchange',exchangeConfig,function(e,o){
			res.render('exchangeconfig', { config: o });		
		});
	});

	app.post('/admin/exchange/config', checkAuth,function(req, res) {
		UT.setExchangeConfig(req.body,function(e,o){
			res.redirect('/admin/exchange/config');		
		});
	});

	app.get('/admin/kv/config', checkAuth,function(req, res) {
		console.log(subtypeConfig);
		UT.showConfig('kv',subtypeConfig[LANG],function(e,o){
			res.render('kvconfig', { kvs: o });		
		});
	});

	app.post('/admin/kv/config', checkAuth,function(req, res) {
		UT.setKvConfig(req.body,function(e,o){
			res.redirect('/admin/kv/config');		
		});
	});

	app.get('/admin/prize/config', checkAuth,function(req, res) {
		UT.showConfig('prize',prizeConfig,function(e,o){
			res.render('prizeconfig', { config: o });		
		});
	});

	app.post('/admin/prize/config', checkAuth,function(req, res) {
		UT.setPrizeConfig(req.body,function(e,o){
			res.redirect('/admin/prize/config');		
		});
	});



	app.get('/admin/upload',function(req,res){
			console.log(req.query.img);
			res.render('upload',{name:req.query.name,src:req.query.src});
	});

	app.post('/admin/upload',function(req,res){
		console.log('file',req.files);
		console.log('body',req.body);
		console.log('body',req.files.myFile.name);
		var path = req.files.myFile.path.toLowerCase();
		if(path != req.files.myFile.path){
			fs.rename(req.files.myFile.path,path,function(e){
				path = path.replace('app/public','');
				res.render('upload',{name:req.body.img_name,src:path});

			});
		}else{
			path = path.replace('app/public','');
			res.render('upload',{name:req.body.img_name,src:path});
		}
	
		//res.redirect('/admin/upload?name='+req.body.img_name+"&="+req.files.myFile.name);
	});

// logged-in user homepage //





// logged-in user homepage //
	
	app.get('/admin/home', checkAuth,function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/admin/');
	    }   else{
			res.render('home', {
				title : 'Control Panel',
				countries : CT,
				udata : req.session.user
			});
	    }
	});
	
	app.post('/admin/home', checkAuth,function(req, res){
		if (req.param('user') != undefined) {
			UM.updateUser({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				pass		: req.param('pass')
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-user');
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.status(200).send('ok');
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.status(200).send('ok'); });
		}
	});
// password reset //

	app.post('/admin/lost-password', checkAuth,function(req, res){
	// look up the user's user via their email //
		UM.getUserByEmail(req.param('email'), function(o){
			if (o){
				res.status(200).send('ok');
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// should add an ajax loader to give user feedback //
					if (!e) {
					//	res.status(200).send('ok');
					}	else{
						res.status(400).send('email-server-error');
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/admin/reset-password', checkAuth,function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		UM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('admin/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/admin/reset-password', checkAuth,function(req, res) {
		var nPass = req.param('pass');
	// retrieve the user's email from the session to lookup their user and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		UM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});
	
// view & delete users //
	
	app.get('/admin/print', checkAuth,function(req, res) {
		UM.getAllRecords( function(e, users){
			res.render('print', { title : 'User List', accts : users });
		})
	});
	
	app.post('/admin/delete', checkAuth,function(req, res){
		UM.deleteUser(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
	            req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});
	
	app.get('/admin/reset', checkAuth,function(req, res) {
		UM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});
	

	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
