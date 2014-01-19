
var Repo = {
    name: require('../../middleware/users/git-profile-name')
  , path: require('../../middleware/repo-path')
  , repo: require('../../middleware/get-repo')
};

function fetchUser (profile, fn) {
  if (!fn) { return fetchUser.bind(this, profile); }
  profile.repo = getRepo(profile);
  findMaster(profile, fn);
}
function getRepo (profile) {
  var path = Repo.path.get(profile.name, Repo.name.get(profile.name));
  var repo = Repo.repo.get(path);
  return repo;
}

function findRepo (profile, next) {
  profile.repo = getRepo(profile);
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

function subscribe (opts, server) {
  console.log("REGISTERING", module.id);

  function configure (hook, next) {
    hook.map(findRepo);
    hook.map(findMaster);
    next( );
  }
  server.events.on('profile', configure);
}
var api = {
    getRepo    : getRepo
  , fetchUser  : fetchUser
  , findRepo   : findRepo
  , findMaster : findMaster
};
module.exports = subscribe;
module.exports.api = api;
