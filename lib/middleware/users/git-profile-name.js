
module.exports = function configure (opts, server) {
  return function (req, res, next) {
    req.user = req.params.user;
    req.params.owner = req.params.user;
    req.repo_name = req.user + '.profile';
    console.log('setting repo name', req.repo_name);
    next( );
  }
}
