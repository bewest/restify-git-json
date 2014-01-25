
var Repo = {
    name: require('../../../middleware/users/git-profile-name')
  , path: require('../../../middleware/repo-path')
  , repo: require('../../../middleware/get-repo')
};

function getRepo (profile) {
  var name = profile.name;
  var path = Repo.path.get(name, Repo.name.get(name));
  var repo = Repo.repo.get(path);
  return repo;
}

function findRepo (profile, next) {
  profile.repo = getRepo(profile);
  next(null, profile);
}
var api = {
    getRepo    : getRepo
  , findRepo   : findRepo
};
module.exports = findRepo;
module.exports.api = api;
