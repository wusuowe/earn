var crypto      = require('crypto');
var MongoDB     = require('mongodb').Db;
var Server      = require('mongodb').Server;
var moment      = require('moment');

var ST = require('./setting');
var dbPort      = ST.dbPort;
var dbHost      = ST.dbHost;
var dbName      = ST.dbName;
//var express = require('express');
//var app = express();
var util = require('util')

var Q = require('q');
var async = require('async');

/* establish the database connection */

console.log(moment("2014-09-20").unix());


var rnd = function(start, end){
	    return Math.floor(Math.random() * (end - start) + start);
};
var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
var uuid = db.collection('uuid');


var rand = function(callback){
	console.log('haha');
	var n = rnd(10000000,100000000);
	console.log(n);
	uuid.findOne({code:n},function(e,o){
		console.log("find");
		if(o){
			console.log("find one, retry");
			rand(callback);
		}else{
			uuid.insert({code:n},{safe:true},function(e){
			console.log("insert one");});
			callback(n);
		}
	});
	
}


db.open(function(e, d){
	if (e) {
		console.log(e);
	}   else{
		console.log('connected to database :: ' + dbName);
	}

	rand(function(n){console.log("get rand",n)});

});




