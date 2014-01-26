var es = require('event-stream')
  , gitStream = require('../../../stream-git')
  , callbacks = require('./callbacks')
  , logger = require('../../logger')
  ;

function saveDelta (profile, opts, next) {
  var log = logger.logger.log;
  
  log.info('SAVE DELTA', profile);
  var config = opts;
  var message = opts.message;
  profile.repo.load('refs/heads/master', saveUpload);
  function saveUpload (err, ref, hash) {
    // log.info('on LOAD', config, err, ref, hash);
    // log.info('SAVING', profile.user);
    if (config.create && (err && err.code == 'ENOENT')) {
      err = null;
    }
    if (!err && (ref || config.create)) {
      // log.info('SAVING', profile.user);

      var incoming = {name: 'profile.json', content: JSON.stringify(profile.user)};
      var input = es.readArray([incoming]);
      log.info("COMMITTING", profile.user);
      var opts = callbacks(profile.user, profile.committer, message);
      // log.info("COMMITTING", opts);
      // opts.getAuthor(log.info);
      // opts.getCommitter(log.info);
      opts.parents = [hash];

      var git = gitStream(profile.repo, opts);
      es.pipeline(input, git, es.writeArray(finish));
      function finish (err, results) {

        var result = results.pop( );
        // log.info("XXX UPDATED PROFILE", err, profile.user, result);
        // result.url = req.profile.url;
        // profile.url = req.profile.url;
        profile.repo.setHead('master', function onMaster (err, master, hash) {
          // log.info('set to master', err, master);
          profile.repo.updateHead(result.head.commit, function onUpdated (err, update) {
            // log.info('updated master', 'err', err, 'update', update);
            profile.updated = result;
            // res.send(201, profile);
            return next(null, profile);
          });
        });
      };
    }
  };
}

function save (user, opts) {
  var log = logger.logger.log;
  log.info('CREATE SAVE HOOK', user, opts);
  return iter;

  function iter (profile, next) {
    saveDelta(profile, opts, next);
  }
}
module.exports = save;
module.exports.saveDelta = saveDelta;

