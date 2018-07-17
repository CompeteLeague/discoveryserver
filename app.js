var express = require('express');
var bodyParser = require('body-parser');
var level = require('level');
var app = express();


// Middleware
app.use(bodyParser.json());


// Logic

function DataResponse(status, data) {
  return {
    status: status,
    data: data
  };
}

function ErrorResponse(status, error) {
  return {
    status: status,
    data: {
      error: error
    }
  };
}

function handleError(err) {

}

function registerService(req, callback) {
  if (!req.body.name || !req.body.host) {
    // TODO: Test if DB is open at this point in the call
    return callback(null, ErrorResponse(400, 'Bad Request. Payload must contain attrbiutes "name" and "host".'));
  }
  var db = level('./servers');
  var servername = req.body.name;
  var serverhost = req.body.host;
  var alreadyRegistered = false;
  var val, myHosts;
  db.get(servername, function(geterr, hosts) {
    if (geterr) {
      if (geterr.notFound) {
        val = [];
        val.push(serverhost);
      } else {
        db.close(function(err) {
          if (err) return callback(err, null);
        });
        return callback(geterr, null);
      }
    } else {
      myHosts = JSON.parse(hosts);
      for (var i = 0; i < myHosts.length; i++) {
        if (myHosts[i] === serverhost) {
          alreadyRegistered = true;
          break;
        }
      }
      if (alreadyRegistered) {
        db.close(function(err) {
          if (err) return callback(err, null);
        });
        // TODO: Maybe return 200 and pretend like nothing bad happened instead of 409
        return callback(null, ErrorResponse(409, "Conflict. Host already registered."));
      } else {
        val = myHosts;
        val.push(serverhost);
      }
    }
    db.put(servername, JSON.stringify(val), function(puterr) {
      if (puterr) {
        db.close(function(err) {
          if (err) return callback(err, null);
        });
        return callback(puterr, null);
      }
      db.close(function(err) {
        if (err) return callback(err, null);
      });
      return callback(null, DataResponse(200, {
        servername: serverhost
      }));
    });
  });
}

function getService(req, callback) {
  var db = level('./servers');
  db.get(req.params.name, function(geterr, hosts) {
    if (geterr) {
      db.close(function(err) {
        if (err) callback(err, null);
      });
      if (geterr.notFound) {
        callback(null, ErrorResponse(404, 'Not Found. There are no entries for given service name: ' + req.params.name));
      }
      callback(geterr, null);
    } else {
      db.close(function(err) {
        if (err) callback(err, null);
      });
      callback(null, DataResponse(200, {
        hosts: JSON.parse(hosts)
      }));
    }
  });
}

function removeService(req, callback) {
  // TODO: implement logic: don't remove the whole key value pair if there are
  // multiple entries for given key.
  var db = level('./servers');
  var servername = req.params.name;
  var serverhost = req.params.host;
  var myHosts;
  db.get(servername, function(geterr, hosts) {
    if (geterr) {
      db.close(function(err) {
        if (err) callback(err, null);
      });
      if (geterr.notFound) {
        callback(null, ErrorResponse(404, 'Not Found. There are no entries for given service name: ' + req.params.name));
      }
      callback(geterr, null);
    } else {
      myHosts = JSON.parse(hosts);
      for (var i = 0; i < myHosts.length; i++) {
        if (myHosts[i] === serverhost) {
          myHosts.splice(i, 1);
          break;
        }
      }
      if (myHosts.length > 0) {
        // still hosts left - dont remove. put again.
        db.put(servername, JSON.stringify(myHosts), function(puterr) {
          if (puterr) {
            db.close(function(err) {
              if (err) return callback(err, null);
            });
            return callback(puterr, null);
          } else {
            db.close(function(err) {
              if (err) return callback(err, null);
            });
            return callback(null, DataResponse(200, {
              servername: serverhost
            }));
          }
        });
      } else {
        // no hosts left remove
        db.del(servername, function(delerr) {
          if (delerr) {
            db.close(function(err) {
              if (err) return callback(err, null);
            });
            return callback(delerr, null);
          } else {
            db.close(function(err) {
              if (err) return callback(err, null);
            });
            return callback(null, DataResponse(200, {
              servername: serverhost
            }));
          }
        });
      }
    }
  });
}


// Routes
app.post('/servers', function(req, res) {
  registerService(req, function(err, myResponse) {
    if (err) {
      console.log('Level-Database error:', err);
      res.status(500).end();
    } else {
      res.status(myResponse.status).json(myResponse.data);
    }
  });
});

app.get('/servers', function(req, res) {
  res.status(501).send({
    error: 'Path not implemented as it is not part of the service.'
  });
});

app.get('/servers/:name', function(req, res) {
  getService(req, function(err, response) {
    if (err) {
      console.log('Level-Database error:', err);
      res.status(500).end();
    } else {
      res.status(response.status).json(response.data);
    }
  });
});

app.put('/servers/:name', function(req, res) {
  res.status(501).send({
    error: 'Path not implemented as it is not part of the service.'
  });
});

app.delete('/servers/:name/:host', function(req, res) {
  removeService(req, function(err, response) {
    if (err) {
      console.log('Level-Database error:', err);
      res.status(500).end();
    } else {
      res.status(response.status).json(response.data);
    }
  });
});

app.listen(8081);
