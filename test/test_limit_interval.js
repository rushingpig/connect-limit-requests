/**
 * Tests
 *
 * @author Lei Zongmin<leizongmin@gmail.com>
 */

var events = require('events');
var util = require('util');
var express = require('express');
var should = require('should');
var supertest = require('supertest');
var brightFlow = require('bright-flow');
var me = require('../');

var RESPONSE_TOO_MANY_REQUESTS = 'Too Many Requests'; 
var RESPONSE_OK = 'OK';
var RESPONSE_NOT_FOUND = 'Not Found';

function expect (app, path, status, body, done) {
  return supertest(app).get(path).expect(status, body).end(function (err, res) {
    if (err) throw err;
    //console.log(res.text);
    done();
  })
}

describe('Test connect-refresh-limit middleware #1', function () {
  
  it('#limit & interval', function (done) {
    
    var INTERVAL = 1000;

    var app = express();
    app.use(me({
      proxy:            false,
      interval:         INTERVAL,
      limit:            5,
      failureLimit:     0,
      refreshInterval:  0,
      connections:      1000,
      callback: function (code, req, res, next) {
        code.should.equal(me.OVER_REQUEST_LIMIT);
        res.send(429, RESPONSE_TOO_MANY_REQUESTS);
      }
    }));
    
    app.get('/', function (req, res, next) {
      res.end(RESPONSE_OK);
    });

    var task = brightFlow.series();
    var doRequest = function (done) {
      expect(app, '/', 200, RESPONSE_OK, done);
    };
    for (var i = 0; i < 5; i++) {
      task.do(doRequest);
    }
    task.do(function (done) {
      expect(app, '/', 429, RESPONSE_TOO_MANY_REQUESTS, done);
    });
    task.end(function () {
      setTimeout(function () {
        expect(app, '/', 200, RESPONSE_OK, done);
      }, INTERVAL);
    });

  });
  
});
