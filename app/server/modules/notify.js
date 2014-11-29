var UT = require('./utility');
var request = require('request-json');
var moment = require('moment');
//var UT = require('./utility');

var client = request.newClient('http://msg.umeng.com');
var appMasterSecret = "8pj5bqixgnw9tmlc5c6ks95nwd6jnlt7";

var data = {
	appkey:"541febf1fd98c52fad006d9f",
	timestamp:"xxx",
    validation_token:'',
	type:"unicast",
	device_tokens:"usertoken",
	payload:{
		display_type:"notification",
		body:{
			ticker:"you have a message",
			title:"You get a gift",
			text:"This is a joke",
			after_open:"go_app",
			icon:'small_icon',
			largeIcon:'large_icon'
		}

	}
};

var androidPush = function(token,type,ticker,title,text){
	data.timestamp = moment().unix().toString();
	data.device_tokens = token;
	data.type = type,
	data.payload.body.ticker = ticker;
	data.payload.body.title = title;
	data.payload.body.text = text;
	data.validation_token = UT.md5((data.appkey + appMasterSecret+data.timestamp).toLowerCase());
	console.log(data);
	client.post('/api/send', data, function(err, res, body) {
		console.log(res.statusCode,body);
	});

}
exports.androidPush = androidPush;
//pushNotify("ArCDbmapMvg97h_vLd5pvD1qV77lHGWAh-zADdUTiAoC","notification","you have a message","You get a gift","This is a joke");

var apns = require('apn');
var options = {
	cert: '/home/joker/earn/app/server/modules/config/certification/prodPushChatCert.pem', /* Certificate file path */
	key:  '/home/joker/earn/app/server/modules/config/certification/prodPushChatKey.pem', /* Key file path */
	passphrase: 'earn123',
	gateway: 'gateway.push.apple.com',/* gateway address */
	port: 2195,                       /* gateway port */
	errorCallback: errorHappened ,    /* Callback when error occurs function(err,notification) */
}; 

var dev_options = {
	cert: '/home/joker/earn/app/server/modules/config/certification/PushChatCert.pem', /* Certificate file path */
	key:  '/home/joker/earn/app/server/modules/config/certification/PushChatKey.pem', /* Key file path */
	passphrase: 'earn123',
	gateway: 'gateway.sandbox.push.apple.com',/* gateway address */
	port: 2195,                       /* gateway port */
	errorCallback: errorHappened ,    /* Callback when error occurs function(err,notification) */
}; 

var apnsConnection = new apns.Connection(options);
//var apnsConnection = new apns.Connection(dev_options);


function errorHappened(err, notification){
	console.log("err " + err);
}

var payload ={
	display_type:"notification/message",
	body:{
		ticker:"you have a message",
		title:"You get a gift",
		text:"This is a joke",
		after_open:"go_app"
	}

}

var applePush =function(token,badge,alertMsg,payLoad){

	//var token = "d4b240e56caab7056f990495e8fcb5d886274082fe92f66ee85861e0f92af254";
	var myDevice = new apns.Device(token);
	var note = new apns.Notification();
	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	//note.badge = badge;
	note.sound = "ping.aiff";
//	note.alert = "You have a new message";
	note.alert = alertMsg;
	note.payload = {'messageFrom': 'earn-money'};
	//note.payload = payLoad;
	note.device = myDevice;

	apnsConnection.sendNotification(note);
}

exports.applePush = applePush;
if (require.main === module){
	var token = "27c832cab07145ba46fb6c4adb72dae6143e639b97f058a43cdd95a50c9ffad1";
	var token = "81ac6f40efc10e8b45ad0e023778623b37071e1f15d6f72320d6c05b035516a4";
	var badge = 1;
	var alertMsg = "haha!";
	var   payload ={
		display_type:"notification/message",
		body:{
			ticker:"you have a message",
			title:"You get a gift",
			text:"This is a joke",
			after_open:"go_app"
		}

	}
	applePush(token,badge,alertMsg,payload);

}

function log(type) {
	return function() {
		console.log(type, arguments);
	}
}

apnsConnection.on('error', log('error'));
//apnsConnection.on('transmitted', log('transmitted'));
apnsConnection.on('timeout', log('timeout'));
apnsConnection.on('connected', log('connected'));
apnsConnection.on('disconnected', log('disconnected'));
apnsConnection.on('socketError', log('socketError'));
apnsConnection.on('transmissionError', log('transmissionError'));
apnsConnection.on('cacheTooSmall', log('cacheTooSmall')); 

