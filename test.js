var express = require('express');
var app = express();
var util = require('util')
var ICVL  = require('iconv-lite');
var crypto = require('crypto');
var s = '哈哈';
var s = ICVL.encode(s, 'utf8');
console.log(s);
b = crypto.createHash('md5').update(s).digest('hex');
console.log(b);
b = crypto.createHash('md5').update(s.toString()).digest('hex');
console.log(b);

function rnd(start, end){
	return Math.floor(Math.random() * (end - start) + start);
}
//console.log(rnd(10000000,100000000));

var rand = function(){
	var n = rnd(10000000,100000000);
	console.log(n);
	if(n>50000000){
		return n;
	}else{
		return rand();
	}
}

//rand();

app.get('/', function(req, res){
	  res.send('hello world');
});

var Q = require('q');

