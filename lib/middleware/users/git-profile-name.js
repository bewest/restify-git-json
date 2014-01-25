
function name (hint) {
  return hint + '.profile';
}
module.exports = function configure (opts, server) {
  return function (req, res, next) {
    req.user = req.params.user;
    req.params.owner = req.params.user;
    req.repo_name = name(req.user);
    req.log.info('setting repo name', req.repo_name);
    next( );
  }
}
module.exports.get = name;
