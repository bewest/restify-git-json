var es = require('event-stream')
  , gitStream = require('../../stream-git')
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
var keys = ['name', 'handle', 'email', 'committer', 'author', 'data'];
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

function saveDelta (profile, opts, next) {
  if (!next) { next = opts; opts = {message: 'updating profile'}; };
  var message = opts.message;
  console.log("saveDelta");
  profile.repo.load('refs/heads/master', saveUpload);
  function saveUpload (err, ref, hash) {
    console.log('on LOAD', err, ref, hash);
    if (!err && ref) {

      console.log('COMMIT RESULTS', arguments);
      var incoming = {name: 'profile.json', content: JSON.stringify(profile.user)};
      var input = es.readArray([incoming]);
      var opts = callbacks(profile, profile.committer, message);
      opts.parents = [hash];

      var git = gitStream(profile.repo, opts);
      es.pipeline(input, git, es.writeArray(finish));
      function finish (err, results) {

        var result = results.pop( );
        // result.url = req.profile.url;
        // profile.url = req.profile.url;
        profile.repo.setHead('master', function onMaster (err, master) {
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
    // res.send(400, {err: err, msg: ref, url: req.profile.url});
    // next(null, {err: err, msg: ref, url: req.profile.url});
  };
}

function applyDelta (profile, update) {
  var user = { };
  console.log("applyDelta", update);
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
};
module.exports = api;
