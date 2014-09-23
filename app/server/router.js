
var GM = require('./modules/game');
var AM = require('./modules/account-manager');
var UT = require('./modules/utility');
var FD = require('./modules/score-feedback');

var responseFun = function(res,e,o){
	if(e){
		res.status(400).send({'code':'error','msg':e,'data':''});
	}else{
		res.status(200).send({'code':'ok','msg':'','data':o});
	}

}

module.exports = function(app) {

	app.get('/*', function(req, res,next){
		var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		console.log("From",ip,req.headers['url']);
		next();

	});
	
	app.post('/*', function(req, res,next){
		next();
	});

	app.post('/exchange',function(req,res){
		AM.exchange(req.body.user_id,req.body.type,req.body.num,function(e,o){
			responseFun(res,e,o);
		});

	});

	app.get('/score/feedback/aarki',function(req,res){
		FD.scoreFromAarki(req.query,function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/score/feedback/dianru',function(req,res){
		FD.scoreFromDianru(req.query,function(e,o){
			responseFun(res,e,o);	
		});


	});
	
	app.get('/score/feedback/duomeng',function(req,res){
			FD.scoreFromDuomeng(req.query,function(e,o){
			responseFun(res,e,o);	
		});

	});
	
	app.get('/score/feedback/miidi',function(req,res){
		FD.scoreFromMiidi(req.query,function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/score/feedback/youmeng',function(req,res){
		FD.scoreFromYoumeng(req.query,function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/score/feedback/youmi',function(req,res){
		FD.scoreFromYoumi(req.query,function(e,o){
			responseFun(res,e,o);	
		});

	});

	app.get('/get/exchange/config',function(req,res){
		res.status(200).send({'code':'ok','msg':'','data':exchangeConfig});
	});

	app.get('/get/game/desc',function(req,res){
		GM.getGameDesc(function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/latest/record',function(req,res){
		UT.getLatestRecord(function(e,o){
			responseFun(res,e,o);
		});
	});

	app.get('/get/lotterycodes',function(req,res){
		GM.lotteryCodes(req.query['user_id'],function(e,o){
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
		UT.getRecord(req.body.user_id,req.body.type,req.body.subtype,req.body.start,req.body.limit,function(e,o){
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
	app.post('/set/contact',function(req,res){
		var contact = {
			"QQ":req.body.QQ,
			"email":req.body.email,
			"phone":req.body.phone

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

	app.get('/get/user',function(req,res){
		var userId = req.query['user_id'];
		var deviceId = req.query['device_id'];
		AM.getUser(deviceId,userId,function(e,o){
			if(e && deviceId){
				AM.createAccount(deviceId,function(e,o){
					if(e){
						responseFun(res,e,o);
					}else{
						AM.getUser(deviceId,userId,function(e,o){
							responseFun(res,e,o);
						});
					}
				});
			}else if(o){
				responseFun(res,e,o);
			}


		});

	});


























// logged-in user homepage //
	
	app.get('/home', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
			res.render('home', {
				title : 'Control Panel',
				countries : CT,
				udata : req.session.user
			});
	    }
	});
	
	app.post('/home', function(req, res){
		if (req.param('user') != undefined) {
			AM.updateAccount({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				pass		: req.param('pass')
			}, function(e, o){
				if (e){
					res.send('error-updating-account', 400);
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});
	
// creating new accounts //
	
	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.param('name'),
			email 	: req.param('email'),
			user 	: req.param('user'),
			pass	: req.param('pass'),
			country : req.param('country')
		}, function(e){
			if (e){
				res.send(e, 400);
			}	else{
				res.send('ok', 200);
			}
		});
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.param('email'), function(o){
			if (o){
				res.send('ok', 200);
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// should add an ajax loader to give user feedback //
					if (!e) {
					//	res.send('ok', 200);
					}	else{
						res.send('email-server-error', 400);
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}	else{
				res.send('email-not-found', 400);
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.param('pass');
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
	            req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
