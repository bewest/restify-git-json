
var path = require('path');

var restify = require('restify')
  , bunyan = require('bunyan')
  ;

var install = require('./lib/install');
var logger = require('./lib/api/logger');

function createServer(opts) {
  if (!opts.log) {
    opts.log = logger(opts);
  }
  var server = restify.createServer(opts);

  // server.pre(restify.pre.pause( ));
  server.log.info('info test logger', 'foo', 'bar');
  server.pre(restify.pre.sanitizePath( ));
  server.pre(restify.pre.userAgentConnection( ));
  server.pre(restify.requestLogger( ));

  server.use(restify.dateParser( ));
  server.use(restify.queryParser( ));
  server.use(restify.gzipResponse( ));

  opts.bodyParser = restify.bodyParser;
  install(server, opts);

  return server;
}
module.exports = createServer;

if (!module.parent) {
  var env = require('./env');
  var port = env.port || 6776;

  var server = createServer(env);
  server.listen(port, function( ) {
    server.log.info('listening on', server.name, server.url, server.urlize( ).toString( ));
    console.log('listening on', server.name, server.url, server.urlize( ).toString( ));
  });
  server.on('after', restify.auditLogger({
    body: true,
    log: bunyan.createLogger({
      level: env.log_level || 'info',
      name: env.service || 'audit',
      stream: env.log_stream || process.stderr
    })
  }));
}

