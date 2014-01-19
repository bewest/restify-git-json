var middleware = require('../../middleware')
  , es = require('event-stream')
  , fs = require('fs')
  , path = require('path')
  , gitStream = require('../../stream-git')
  ;
function callbacks (profile, committer, msg) {
  var config = { };
  function getMessage (fn) {
    fn(msg);
  }
  function getAuthor (fn) {
    if (profile.author) {
      return fn({name: profile.author.handle || profile.author.name, email: profile.author.email});
    }
    if (profile.user) {
      return fn({name: profile.user.handle || profile.user.name, email: profile.user.email});
    }
    fn({name: profile.handle, email: profile.email});
  }
  function getCommitter (fn) {
    if (committer) {
      return fn({name: committer.name, email: committer.email});
    }
    if (profile.committer) {
      return fn({name: profile.committer.name, email: profile.committer.email});
    }
    return fn(null);
  }
  config.getMessage = getMessage;
  config.getAuthor = getAuthor;
  config.getCommitter = getCommitter;
  return config;
}

function valid (origin, field, value) {
  return value || origin[field];
}
function install (origin, each, root) {
  return function (key) {
    // console.log("KEY", key, root[key]);
    return (origin[key] = each(origin, key, root[key]));
  }
}
var keys = ['name', 'handle', 'email', 'committer', 'author', 'user', 'data'];

function handler (req, res, next) {
  var profile = { };

  //
  var message = req.params.message || "updating profile";
  var committer = req.params.committer || null;
  if (!committer || (!committer.name && !committer.email)) {
    committer = null;
  }
  keys.forEach(install(profile, valid, req.profile.user));
  keys.forEach(install(profile, valid, req.params));

  console.log("HAVE PROFILE", req.profile);
  console.log("update PROFILE to", profile);
  console.log('sending', res.profile);
  res.send(201, res.profile);
  /*
  server.updateUser(req.params.user, req.params, function (err, result) {
    console.log('updated user', arguments);
    var b = Array.prototype.slice.apply(arguments);
    res.send(201, b.pop( ));
  });
  */
  next( );
  return;
  /// res.send(201, {full: req.profile, old: req.profile.user, 'new': profile.user, complete: profile});
  // next( );
  // return;
  
  req.repo.load('refs/heads/master', saveUpload);
  function saveUpload (err, ref, hash) {
    console.log('on LOAD', err, ref, hash);
    if (!err && ref) {

      console.log('COMMIT RESULTS', arguments);
      var incoming = {name: 'profile.json', content: JSON.stringify(profile)};
      var input = es.readArray([incoming]);
      var opts = callbacks(profile, committer, message);
      opts.parents = [hash];

      var git = gitStream(req.repo, opts);
      es.pipeline(input, git, es.writeArray(finish));
      function finish (err, results) {

        var result = results.pop( );
        result.url = req.profile.url;
        profile.url = req.profile.url;
        req.repo.setHead('master', function onMaster (err, master) {
          console.log('set to master', err, master);
          req.repo.updateHead(result.head.commit, function onUpdated (err, update) {
            console.log('updated master', 'err', err, 'update', update);
            profile.updated = result;
            res.send(201, profile);
            return next( );
          });
        });
      };
    }
    res.send(400, {err: err, msg: ref, url: req.profile.url});
    next( );
  };
}
var endpoint = {
    path: '/users/:user'
  , method: 'post'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, updateUser, endpoint.handler);
  }
  var userInfo = middleware.userInfo(opts, server);
  var mandatory = middleware.mandatory(opts, server);
  var uploads = middleware.builtin.uploads(opts, server);
  function updateUser (req, res, next) {
    console.log("UPDATING PARAMS", req.params, req.body, req.files);
    server.updateUser(req.params.user, req.body.user, {save:true}, function (result) {
      console.log('UPDATED user', arguments);
      res.profile = result;
      next( );

    });
  }
  endpoint.middleware = mandatory.concat(userInfo).concat(uploads);
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

