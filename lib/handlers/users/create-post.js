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

function handler (req, res, next) {
  if (res.profile) {
    res.send(201, res.profile);
    return next( );
  }
  res.send(405, {err: '???', old: req.profile, proposed: res.profile, url: req.profile.url});
  next( );
  return;

  var profile = { };
  function valid (field, value) {
    return value || profile[field];
  }
  function install (each, root) {
    return function (key) {
      console.log("KEY", key, root[key]);
      return (profile[key] = each(key, root[key]));
    }
  }
  var keys = ['name', 'handle', 'email', 'committer', 'author', 'user'];

  req.repo.load('master', function (err, ref) {
    console.log('on LOAD', err, ref);
    // don't allow repeated creation
    if (err && err.code == 'ENOENT') {

      req.profile.handle = req.params.user;
      var message = req.params.message || "initial profile creation";
      var committer = req.params.committer || null;
      if (!committer || (!committer.name && !committer.email)) {
        committer = null;
      }
      keys.forEach(install(valid, req.profile))
      keys.forEach(install(valid, req.params))
      console.log('repo path', req.repo_path);

      var user_path = path.dirname(req.repo_path);
      console.log('user path', user_path);
      fs.mkdir(user_path, onCreatedUserDir);
      return;
      function onCreatedUserDir (err) {
        console.log('created user directory', arguments);
        console.log('creating repo directory', req.repo_path);
        fs.mkdir(req.repo_path, onCreatedDirectory);
      };
      function onCreatedDirectory (err) {
        console.log('MKDIR', arguments);
        var incoming = {name: 'profile.json', content: JSON.stringify(profile)};
        var input = es.readArray([incoming]);
        var opts = callbacks(profile, committer, message);
        var git = gitStream(req.repo, opts);
        es.pipeline(input, git, es.writeArray( function finish (err, results) {
          var result = results.pop( );
          // result.url = req.profile.url;
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
        }));
      };
    }
    // TODO: info leak?
    res.send(405, {err: err, taken: ref, url: req.profile.url});
    next( );
  });
}
var endpoint = {
    path: '/users/:user/create'
  , method: 'post'
  , handler: handler
};
function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}
module.exports = function configure (opts, server) {
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, createUser, endpoint.handler);
  }
  var userInfo = middleware.minUser(opts, server);
  var mandatory = middleware.mandatory(opts, server);
  var uploads = middleware.builtin.uploads(opts, server);
  endpoint.middleware = mandatory.concat(userInfo).concat(uploads);
  function paramHelper (params) {
    // (params.user && req.params.user.name && req.params.user.handle)
    var profile;
    if (params.email && params.name) {
      var user = { user: clone(params) };
      profile = clone(params);
      profile.name = params.user;
      return profile;
    }
    return false;
  }
  function createUser (req, res, next) {
    if (req.profile && req.profile.repo && req.profile.user.name) {
      console.log("CREATING EXISTING PROFILE", req.profile);
      // res.send(405, {err: err, taken: ref, url: req.profile.url});
      return next( );

    }
    console.log("UPDATING PARAMS", req.params.user, req.params, req.body, req.files);
    var name = req.params.user;
    var update = req.params;
    var updates = paramHelper(req.params) || ((req.body && req.body.user)
                ? req.body.user : req.body)
                ;
    console.log('repo path', req.repo_path);
    var message = req.params.message || req.body.message
               || "creating user " + name;
    var config = { save:true, create:true
                 , repo_path: req.repo_path, message: message
                 , name: name
                 };
    server.updateUser(name, updates, config, function (result) {
      console.log('UPDATED user', arguments);
      res.profile = result;
      next( );

    });
  }
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

