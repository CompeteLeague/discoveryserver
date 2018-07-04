var express = require('express');
var bodyParser = require('body-parser');
var app = express();


// Middleware
app.use(bodyParser.json());


// Logic
var servers = {};


// Routes
app.post('/servers', function(req, res) {
  console.log('headers', req.headers);
  if (!req.body.name || !req.body.host) {
    res.send(400);
    return;
  }
  if (!servers[req.body.name]) {
    servers[req.body.name] = [];
  }
  servers[req.body.name].push(req.headers.host);
  res.send(req.body);
});

app.get('/servers', function(req, res) {
  // res.send(servers);
  res.send(501);
});

app.get('/servers/:name', function(req, res) {
  if (!servers[req.params.name]) {
    res.send(404);
  } else {
    res.send(servers[req.params.name]);
  }
});

app.put('/servers/:name', function(req, res) {
  // servers[req.params.name] = req.body;
  // res.sendStatus(204);
  res.send(501);
});

app.delete('/servers/:name', function(req, res) {
  var server = servers[req.params.name];
  delete servers[req.params.name];
  res.send(server);
});

app.listen(8081);
