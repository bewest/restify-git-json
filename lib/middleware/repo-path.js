
module.exports = function getPath (opts) {
  var path = require('path');
  return function (req, res, next) {
    req.repo_path = path.join(opts.base, req.params.owner, req.repo_name);
    console.log("GIT PATH", req.repo_path);
    next( );
  };
}
