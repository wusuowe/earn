var MongoDB     = require('mongodb').Db;
var Server      = require('mongodb').Server;

var ST = require('./setting');
var dbPort      = ST.dbPort;
var dbHost      = ST.dbHost;
var dbName      = ST.dbName;
var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
exports.db = db;

exports.initDb = function(callback){
	db.open(function(e, d){
		if (e) {
			console.log(e);
		}else{
			console.log('connected to database :' + dbName);
			db.authenticate('worker','hardwork321!',function(e,o){
				if(e){
					console.log(e);
					db.close()
				}else{
					console.log('authenticate successful');
					callback();
				}
			});
		}
	});
};
