
// TODO: move to middleware
module.exports = function configure (opts) {
  return function repo_name (req, res, next) {
    req.repo_name = req.params.repo + '.git';
    next( );
  }
};
