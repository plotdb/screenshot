#!/usr/bin/env node
var t1, fs, path, template, express, bodyParser, colors, yargs, lib, pageshot, server, argv, port;
t1 = Date.now();
fs = require('fs');
path = require('path');
template = require('template');
express = require('express');
bodyParser = require('body-parser');
colors = require('colors');
yargs = require('yargs');
lib = path.dirname(fs.realpathSync(__filename.replace(/\(.+\)$/, '')));
pageshot = require(lib + "/pageshot");
server = {
  init: function(opt){
    var ss;
    ss = new pageshot(opt);
    return ss.init().then(function(){
      var app, cwd;
      app = express();
      cwd = process.cwd();
      app.use(bodyParser.json({
        limit: '1mb'
      }));
      app.use(function(req, res, next){
        res.header('Access-Control-Allow-Origin', "*");
        res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
        return next();
      });
      app.post('/api/screenshot', function(req, res){
        var lc, payload;
        lc = {};
        payload = req.body.url
          ? {
            url: req.body.url
          }
          : {
            html: req.body.html || ""
          };
        return ss.screenshot(payload).then(function(it){
          res.contentType('image/png');
          return res.send(it);
        })['catch'](function(it){
          console.log(it);
          return res.status(500).send();
        });
      });
      app.post('/api/print', function(req, res){
        var lc, payload;
        lc = {};
        payload = req.body.url
          ? {
            url: req.body.url
          }
          : {
            html: req.body.html || ""
          };
        return ss.print(payload).then(function(it){
          res.contentType('application/pdf');
          return res.send(it);
        })['catch'](function(it){
          console.log(it);
          return res.status(500).send();
        });
      });
      app.post('/api/merge', function(req, res){
        var lc, payload;
        lc = {};
        payload = {
          list: req.body.list || []
        };
        return ss.merge(payload).then(function(it){
          res.contentType('application/pdf');
          return res.send(it);
        })['catch'](function(it){
          console.log(it);
          return res.status(500).send();
        });
      });
      console.log(("[Server] Express Initialized in " + app.get('env') + " Mode").green);
      return new Promise(function(res, rej){
        var server;
        return server = app.listen(opt.port, function(){
          var delta;
          delta = opt.startTime ? "( takes " + (Date.now() - opt.startTime) + "ms )" : '';
          console.log(("[SERVER] listening on port " + server.address().port + " " + delta).cyan);
          return res({
            server: server,
            app: app
          });
        });
      });
    });
  }
};
module.exports = server;
if (require.main === module) {
  argv = yargs.option('port', {
    alias: 'p',
    description: "port to listen",
    type: 'number'
  }).help('help').alias('help', 'h').check(function(argv, options){
    return true;
  }).argv;
  port = argv.p || process.env.PORT;
  server.init({
    startTime: t1,
    port: port
  });
}
