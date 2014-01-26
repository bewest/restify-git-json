
module.exports = function fixGitRequest (opts) {
  var candidate = /\.git\.git$/;
  return  function (req, res, next) {
    if (candidate.test(req.repo_name)) {
      req.repo_name = req.repo_name.replace(candidate, '.git');
    }
    next( );
  };
};
