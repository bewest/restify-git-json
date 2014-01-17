var path = require('path');
var BASE = '';
function get (user, repo) {
  var args = Array.prototype.slice.apply(arguments);
  args.unshift(BASE);
  return path.join.apply(path, args);
}

module.exports = function getPath (opts) {
  BASE = opts.base;
  console.log("CONFIG GIT BASE", BASE, opts);
  function middle (req, res, next) {
    // req.repo_path = path.join(opts.base, req.params.owner, req.repo_name);
    console.log('GIT PATH', req.params, req.user, req.params.owner, req.repo_name);
    req.repo_path = get(req.params.owner, req.repo_name);
    // path.join(opts.base, req.params.owner, req.repo_name);
    console.log("GIT PATH", req.repo_path);
    next( );
  };
  middle.base = BASE;
  middle.get = get;
  return middle;
}
module.exports.get = get;
