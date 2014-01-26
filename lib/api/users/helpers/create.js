var es = require('event-stream')
  , fs = require('fs')
  , path = require('path')
  ;

function create (profile, opts) {
  var log = require('../../logger').logger.log;
  log.info('CREATE USER HOOK', profile, opts);
  var directories = { };
  directories.user = path.dirname(opts.repo_path);
  directories.repo = opts.repo_path;
  function start (profile, fn) {
    return finish;
    function finish (err, results) {
      var make = results.pop( );
      return fn(null, profile);
    }
  }
  function User (make, fn) {
    log.info('MK USER DIR', make.user);
    fs.mkdir(make.user, dir);
    function dir (err) {
      log.info("ERR", err);
      fn(null, make);
    }
  }
  function Repo (make, fn) {
    fs.mkdir(make.repo, dir);
    function dir (err) {
      fn(null, make);
    }
  }
  function iter (profile, next) {
    log.info('creating repo?', profile, opts, arguments);
    start.callback = next;
    es.pipeline(es.readArray([directories])
      , es.map(User), es.map(Repo)
      , es.writeArray(start(profile, next)));
  }
  return iter;
}
module.exports = create;
