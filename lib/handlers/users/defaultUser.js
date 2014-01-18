
var registered = false;
function install (opts, server) {
  if (registered) { return; }
  console.log("Registering server wide listeners", module.id);
  registered = true;
  server.events.on('profile', function onProfile (hook, next) {
    hook.map(function each (data, fetch) {
      data = data.args.pop( );
      console.log('default profile subscription data', data);
      fetch(null, data);
    });
    next( );
  });
  function fetchUser (name, next) {
    next({name: name});
  }
  if (opts.fetchUser) {
    server.fetchUser = opts.fetchUser;
  } else {
    function setup (name, cb) {
      fetchUser(name, prime);
      function prime (profile) {
        defaultUser(profile, cb);
      }
    }
    function defaultUser (profile, next) {
      var hook = server.events.process('profile', profile, next);
      hook.inject(server.events);
    }
    server.fetchUser = setup;
  }
}

function register (opts, server) {
  if (registered) { return false; }
  install(opts, server);
  registered = true;
  console.log("REGISTERING", module.id);
  var getRepoName = require('../../middleware/users/git-profile-name').get;
  var getRepoPath = require('../../middleware/repo-path').get;
  var getRepo = require('../../middleware/get-repo').get;

  function findRepo (profile, next) {
    var path = getRepoPath(profile.name, getRepoName(profile.name));
    var repo = getRepo(path);
    profile.repo = repo;
    next(null, profile);
  }

  function findMaster (profile, next) {
    function onBlob (err, blob) {
      if (err) return next(null, profile);
      profile.user = JSON.parse(blob.toString( ));
      next(null, profile);
    }
    function onTree (err, tree) {
      if (err) { return next(null, {err:err, profile:profile, tree:tree}); }
      profile.repo.loadAs('blob', tree['profile.json'].hash, onBlob);
    }
    function onMaster (err, master, hash) {
      console.log('master found', hash, err, 'next', next);
      if (err) {
        // user does not exist
        delete profile.repo;
        return next(null, {err: 'does not exist', profile: profile});
      }
      if (master) {
        var author = JSON.parse(JSON.stringify(master.body.author));
        var committer = JSON.parse(JSON.stringify(master.body.committer));
        profile.lastUpdated = master.body.committer.date || master.body.author.date;
        delete author.date;
        delete committer.date;
        profile.author = author;
        profile.committer = committer;
        
      }
      return profile.repo.loadAs('tree', master.body.tree, onTree);
    }
    profile.repo.load('refs/heads/master', onMaster);
  }

  function configure (hook, next) {
    hook.map(findRepo);
    hook.map(findMaster);
    next( );
  }
  server.events.on('profile', configure);

}
module.exports = register;

