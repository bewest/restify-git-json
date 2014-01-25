var bunyan = require('bunyan')
  , restify = require('restify')
  ;

var my = { };

function config (opts) {
  if (opts.serializers) return opts;
  var streamOpt = {
    level: opts.log_level
  , stream: opts.log_stream
  };
  if (opts.log_stream == 'rotating-file') {
    streamOpt = {
      type: 'rotating-file'
    , path: opts.log_path
    , period: '1d'
    , level: opts.log_level || 'info'
    , count: opts.log_keep || 3
    };
  }

  var o = {
    name: opts.service || 'restify-git-json',
    streams: [ streamOpt, {
      // This ensures that if we get a WARN or above all debug records
      // related to that request are spewed to stderr - makes it nice
      // filter out debug messages in prod, but still dump on user
      // errors so you can debug problems
      level: 'warn',
      type: 'raw',
      stream: new restify.bunyan.RequestCaptureStream({
              level: bunyan.WARN,
              maxRecords: 100,
              maxRequestIds: 1000,
              stream: process.stderr
      })

    } ],
    serializers: restify.bunyan.serializers
  }; 
  return o;
}

function create (opts) {
  var log = bunyan.createLogger(config(opts));
  my.log = log;
  return log;
}

if (!my.log) {
  var defaults = { log_stream: { stream: process.stderr, level: null } };
  my.log = create(defaults);
}
module.exports = create;
module.exports.log = my.log;
