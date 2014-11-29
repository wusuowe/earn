
var express = require('express');
var session = require('express-session')
var cookieParser = require('cookie-parser')
var http = require('http');
var app = express();

LANG = "en";
DB_NAME = "earn-money-en";
CONFIG = "config/globe.json";

app.set('port', 4000);
app.set('views', __dirname + '/app/server/views');
app.set('view engine', 'jade');
app.locals.pretty = true;
//  app.use(express.favicon());
//  app.use(express.logger('dev'));
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
	  extended: true
}));
app.use(bodyParser.json());

var multer  = require('multer');

app.use(multer({ dest: './uploads/'}));

//app.use(express.cookieParser());
app.use(cookieParser());
//app.use(express.session({ secret: 'super-duper-secret-secret' }));
//app.use(express.methodOverride());
//app.use(session({secret: 'keyboard-secret-secret'}))


app.use(session({
	    secret: 'keyboard-secret-secret',
	    name: 'severice_name',
//	    store: sessionStore, // connect-mongo session store
	    proxy: true,
	    resave: true,
	    saveUninitialized: true
}));

app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use('/static',express.static(__dirname + '/app/public'));

//app.use(express.errorHandler());

require('./app/server/router')(app);

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
