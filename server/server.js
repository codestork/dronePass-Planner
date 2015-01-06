var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var path = require('path');
var bcrypt = require('bcrypt-nodejs');
var cors = require('cors');

// Router
var router = require('express').Router();
var routes = require('./routes');

var app = express();
var port = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(bodyParser.json({'type':'application/json'}));

for(var route in routes){
  for(var method in routes[route]){
    app[method]('/' + route, routes[route][method]);
  }
}

app.param('gid',function(req,res,next,gid){
  req.gid = gid;
  next();
});
app.param('user_id',function(req,res,next,user_id){
  req.user_id = user_id;
  next();
});

app.listen(port);
console.log("dronePass-Planner now logged into port",port);
