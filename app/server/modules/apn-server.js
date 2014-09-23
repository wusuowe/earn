var apns = require('apn');
var options = {
	cert: './config/certification/PushChatCert.pem',                 /* Certificate file path */
	key:  './config/certification/PushChatKey.pem',                  /* Key file path */
	passphrase: 'earn123',
	gateway: 'gateway.sandbox.push.apple.com',/* gateway address */
	port: 2195,                       /* gateway port */
	errorCallback: errorHappened ,    /* Callback when error occurs function(err,notification) */
}; 
function errorHappened(err, notification){
	console.log("err " + err);
}
var apnsConnection = new apns.Connection(options);

exports.applePush =function(token,badge,alertMsg,payLoad){

//	var token = "d4b240e56caab7056f990495e8fcb5d886274082fe92f66ee85861e0f92af254";
	//var token = "d4b240e56caab7056f990495e8fcb5d886274082fe92f66ee85861e0f92af255";
	var myDevice = new apns.Device(token);
	var note = new apns.Notification();
	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = badge;
	note.sound = "ping.aiff";
//	note.alert = "You have a new message";
	note.alert = alertMsg;
//	note.payload = {'messageFrom': 'Caroline'};
	note.payload = payLoad;
	note.device = myDevice;

	apnsConnection.sendNotification(note);
}
/*
function log(type) {
	    return function() {
			        console.log(type, arguments);
					    }
}

apnsConnection.on('error', log('error'));
apnsConnection.on('transmitted', log('transmitted'));
apnsConnection.on('timeout', log('timeout'));
apnsConnection.on('connected', log('connected'));
apnsConnection.on('disconnected', log('disconnected'));
apnsConnection.on('socketError', log('socketError'));
apnsConnection.on('transmissionError', log('transmissionError'));
apnsConnection.on('cacheTooSmall', log('cacheTooSmall')); 
*/
