
module.exports = function fixGitRequest (opts) {
  var candidate = /\.git\.git$/;
  return  function (req, res, next) {
    console.log("GIT REQUEST", req.repo_name, candidate.test(req.repo_name), req.url);
    if (candidate.test(req.repo_name)) {
      req.repo_name = req.repo_name.replace(candidate, '.git');
      console.log("GIT REQUEST REPLACED:", req.repo_name);
    }
    next( );
  };
};
