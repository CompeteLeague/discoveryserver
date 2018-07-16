var express = require('express');
var bodyParser = require('body-parser');
var app = express();


// Middleware
app.use(bodyParser.json());


// Logic
var servers = {};

function registerService(req) {
  console.log('headers', req.headers);
  if (!req.body.name || !req.body.host) {
    return 400;
  }
  if (!servers[req.body.name]) {
    servers[req.body.name] = [];
  }
  servers[req.body.name].push(req.body.host);
  return req.body;
}

function getService(req) {
  if (!servers[req.params.name]) {
    return 404;
  } else {
    return {
      hosts: servers[req.params.name]
    };
  }
}

function removeService(req) {
  var server = servers[req.params.name];
  delete servers[req.params.name];
  return server;
}


// Routes
app.post('/servers', function(req, res) {
  res.send(registerService(req));
});

app.get('/servers', function(req, res) {
  res.send(501);
});

app.get('/servers/:name', function(req, res) {
  res.send(getService(req));
});

app.put('/servers/:name', function(req, res) {
  res.send(501);
});

app.delete('/servers/:name', function(req, res) {
  res.send(removeService(req));
});

app.listen(8081);
