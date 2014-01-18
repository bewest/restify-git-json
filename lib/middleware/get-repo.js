
var repos = require('../repos');

var createRepo;
function register (opts, server) {
  createRepo = repos(opts);
  return createRepo;
}

function get (hint) {
  return createRepo(hint);
}

module.exports = function configure (opts) {
  register(opts);

  return (function (req, res, next) {
    req.repo = createRepo(req.repo_path);
    next( );
  });
};
module.exports.get = get;
