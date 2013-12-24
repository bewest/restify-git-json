
var repos = require('../repos');

module.exports = function configure (opts) {
  var createRepo = repos(opts);
  return (function (req, res, next) {
    req.repo = createRepo(req.repo_path);
    next( );
  });

};

