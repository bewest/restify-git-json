var path = require('path');

module.exports = function configure(opts, server) {
  return function middle (req, res, next) {
    req.findKeyPath = function (hint, cb) {
      req.log.debug('FINDKEY', 'hint', hint);
      return findKeyPath(req.repo, hint, cb);
    }
    next( );
  }
}
function findKeyPath (repo, hint, cb) {
  var last;
  if (!hint || hint == '.') {
    return cb("bad hint", hint);
  }
  repo.load(hint, function (err, body) {
    if (err && hint) {
      return findKeyPath(repo, path.dirname(hint), cb);
    }
    body.ref = hint;
    return cb(err, body);

  });
}
