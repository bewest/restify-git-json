var middleware = require('../../middleware')
  ;
var path = require('path');
var fs = require('fs');

function repoExists (req, res, next) {
  fs.stat(req.repo_path, function onStat (err, stats) {
    console.log(err, stats);
    if (!err && stats.isDirectory( )) {
      return next( );
    }
    var create = req.urlize('./create');
    req.profile.create = create;
    res.send(404, {msg: 'no such user', user: req.profile});
    res.end( );
    next( );
  });
}

function findKeyPath (repo, hint, cb) {
  var last;
  if (!hint || hint == '.') {
    return cb("bad hint", hint);
  }
  repo.load(hint, function (err, body) {
    console.log('FINDKEY', err, 'hint', hint, body);
    if (err && hint) {
      return findKeyPath(repo, path.dirname(hint), cb);
    }
    body.ref = hint;
    return cb(err, body);

  });
}

// TODO: better error handling
function handler (req, res, next) {
  var ref = 'refs/heads/master/profile.json';
  var result = {params: req.params, input: ref };
  console.log("GET USER", req.user);
  findKeyPath(req.repo, ref, function (err, body) {
    console.log('ERR', err);
    // console.log('tree', tree);
    result.body = body;
    if (body.type == 'commit' && body.body.tree) {
      req.repo.loadAs('tree', body.body.tree, function (err, tree) {
        tree.err = err;
        result.tree = tree;
        console.log('err', err);
        console.log('tree', tree);
        var name = ref.split(body.ref + '/').pop( );
        console.log('name', name, tree, tree[name]);
        if (tree[name] && tree[name].hash) {
          req.repo.loadAs('blob', tree[name].hash, function (err, blob) {
            // blob.err = err;
            result.blob = blob.toString( );
            res.setHeader('content-type', 'text/plain');
            res.send(200, blob.toString( ));
          });
        }

      });
    }
    result.err = err;
  });
  next( );
}

var endpoint = {
    path: '/users/:user'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  var userInfo = middleware.userInfo(opts, server);
  var mandatory = middleware.mandatory(opts, server);
  endpoint.middleware = mandatory.concat(userInfo);
  // endpoint.middleware.push(repoExists);
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

