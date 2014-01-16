var fs = require('fs');
module.exports = function configure (opts, server) {
  function repoExists (req, res, next) {
    fs.stat(req.repo_path, function onStat (err, stats) {
      console.log(err, stats);
      if (!err && stats.isDirectory( )) {
        return next( );
      }
      // TODO: fix urlize
      var create = req.urlize('./create');
      req.profile.create = create;
      res.send(404, {msg: 'no such user', user: req.profile});
      res.end( );
      next( );
    });
  }
  return repoExists;
}

