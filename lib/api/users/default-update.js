var es = require('event-stream')
  , gitStream = require('../../stream-git')
  , fs = require('fs')
  , path = require('path')
  ;
function valid (origin, field, value) {
  return value || origin[field];
}
function install (origin, each, root) {
  return function (key) {
    console.log("KEY", key, root[key]);
    return (origin[key] = each(origin, key, root[key]));
  }
}
var    keys = ['name', 'handle', 'email', 'committer', 'author', 'data'];
// var keys = ['name', 'handle', 'email', 'committer', 'author', 'user'];
function callbacks (profile, committer, msg) {
  var config = { };
  function getMessage (fn) {
    fn(msg);
  }
  function getAuthor (fn) {
    console.log('getAuthor', profile.author);
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

function withOpts (opts) {
  return function iter (data, next) {
    next(null, data, opts);
  }
}

function saveDelta (profile, opts, next) {
  
  console.log('SAVE DELTA', profile);
  var config = opts;
  var message = opts.message;
  profile.repo.load('refs/heads/master', saveUpload);
  function saveUpload (err, ref, hash) {
    // console.log('on LOAD', config, err, ref, hash);
    console.log('SAVING', profile.user);
    if (config.create && err.code == 'ENOENT') {
      err = null;
    }
    if (!err && (ref || config.create)) {
      console.log('SAVING', profile.user);

      var incoming = {name: 'profile.json', content: JSON.stringify(profile.user)};
      var input = es.readArray([incoming]);
      console.log("COMMITTING", profile.user);
      var opts = callbacks(profile.user, profile.committer, message);
      console.log("COMMITTING", opts);
      opts.getAuthor(console.log);
      opts.getCommitter(console.log);
      opts.parents = [hash];

      var git = gitStream(profile.repo, opts);
      es.pipeline(input, git, es.writeArray(finish));
      function finish (err, results) {

        var result = results.pop( );
        console.log("XXX UPDATED PROFILE", err, profile.user, result);
        // result.url = req.profile.url;
        // profile.url = req.profile.url;
        profile.repo.setHead('master', function onMaster (err, master, hash) {
          console.log('set to master', err, master);
          profile.repo.updateHead(result.head.commit, function onUpdated (err, update) {
            console.log('updated master', 'err', err, 'update', update);
            profile.updated = result;
            // res.send(201, profile);
            return next(null, profile);
          });
        });
      };
    }
  };
}

function save (user, opts) {
  console.log('CREATE SAVE HOOK', user, opts);
  return iter;

  function iter (profile, next) {
    saveDelta(profile, opts, next);
  }
}

function create (profile, opts) {
  console.log('CREATE USER HOOK', profile, opts);
  var directories = { };
  directories.user = path.dirname(opts.repo_path);
  directories.repo = opts.repo_path;
  return iter;
  function start (profile, fn) {
    return finish;
    function finish (err, results) {
      var make = results.pop( );
      return fn(null, profile);
    }
  }
  function User (make, fn) {
    fs.mkdir(make.user, dir);
    function dir (err) {
      fn(null, make);
    }
  }
  function Repo (make, fn) {
    fs.mkdir(make.repo, dir);
    function dir (err) {
      fn(null, make);
    }
  }
  function iter (profile, next) {
    console.log('creating repo?', profile, opts, arguments);
    start.callback = next;
    es.pipeline(es.readArray([directories])
      , es.map(User), es.map(Repo)
      , es.writeArray(start(profile, next)));
  }
}


function init (update, opts, fn) {
  if (!fn) { fn = opts; opts = { } };
  console.log("CREATE NEW PROFILE FROM", update, "OPTS", opts);
  var user = (update.user && update.user.name) ? update.user : update;
  if (opts.name) {
    update.handle = opts.name;
    user.handle = opts.name;
  }
  var profile = { };
  if (update.user && !update.user.name) {
    update.handle = update.user;
    profile.name = update.user;
    delete update.user;
  }
  profile.user = user;
  profile.handle = user.handle;
  profile.name = update.handle;
  profile.secret = user.secret;
  profile = applyDelta(profile, update);
  var info = callbacks(profile);
  var inputs = es.readArray(['author', 'committer']);
  function attrs (prop, next) {
    var getter;
    switch (prop) {
      case 'committer':
        getter = info.getCommitter;
        break;
      case 'author':
        getter = info.getAuthor;
        break;
      default:
        return next(null);
        break;
    }
    getter(set);
    function set (value) {
      profile[prop] = value;
      next(null);
    }
  }
  function done (err, results) {
    fn(err, profile);
  }
  es.pipeline(inputs, es.map(attrs), es.writeArray(done));
  return profile;
};

function applyDelta (profile, update) {
  var user = { };
  keys.forEach(install(user, valid, profile.user));
  keys.forEach(install(user, valid, update));
  profile.user = user;
  profile.author = user.author || profile.author;
  profile.committer = user.committer || null;
  return profile;
}

var api = {
    applyDelta: applyDelta
  , saveDelta: saveDelta
  , callbacks: callbacks
  , init: init
  , save: save
  , create: create
  , withOpts: withOpts 
};
module.exports = api;
