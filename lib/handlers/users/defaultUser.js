

var registered = false;
function register (opts, server) {
  if (registered) { return false; }
  registered = true;
  console.log("REGISTERING", module.id);
  var getRepoName = require('../../middleware/users/git-profile-name').get;
  var getRepoPath = require('../../middleware/repo-path').get;
  var getRepo = require('../../middleware/get-repo').get;

  function findRepo (profile, next) {
    var path = getRepoPath(profile.name, getRepoName(profile.name));
    var repo = getRepo(path);
    // console.log("find REPO", path, repo);
    // console.log(profile.name, repo);
    profile.repo = repo;
    // findMaster(profile, next);
    next(null, profile);
  }


  function findMaster (profile, next) {
    function onBlob (err, blob) {
      console.log('onBlob', arguments);
      if (err) return next(null, profile);
      // profile.user = JSON.parse(blob.toString( ));
      console.log('INSERTING new profile', profile);
      next(null, profile);
    }
    function onTree (err, tree) {
      console.log('FOUND TREE PROFILE', err, tree);
      profile.repo.loadAs('blob', tree['profile.json'].hash, onBlob);
    }
    function onMaster (err, master, hash) {
      console.log('master found', hash, err, 'next', next);
      if (err) {
        // user does not exist
        return next("does not exist", profile);
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
      return next(null, profile);
      // return profile.repo.loadAs('tree', master.body.tree, onTree);
    }
    profile.foo = "haha bar";
    // next(null, profile);
    profile.repo.load('refs/heads/master', onMaster);
  }

  function configure (hook, next) {
    console.log('FOUND a HOOK', hook);
    hook.map(function (data, fn) {
      console.log("DEFAULT CHAIN", data);
      fn(null, data);
    });
    hook.map(findRepo);
    hook.map(findMaster);
    function wrapMaster (profile, shift) {
      profile.what = "hah";
      shift(null, profile);
    }
    next( );
  }
  server.events.on('profile', configure);

}
module.exports = register;

