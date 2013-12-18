
var path = require('path');

var restify = require('restify')
  , bunyan = require('bunyan')
  ;

var install = require('./lib/install');

// In true UNIX fashion, debug messages go to stderr, and audit records go
// to stdout, so you can split them as you like in the shell
var log = bunyan.createLogger({
        name: 'server',
        streams: [ {
                level: (process.env.LOG_LEVEL || 'info'),
                stream: process.stderr
        }, {
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
});

function createServer(base) {
  var server = restify.createServer( );

  // server.pre(restify.pre.pause( ));
  server.pre(restify.pre.sanitizePath( ));
  server.pre(restify.pre.userAgentConnection( ));
  server.pre(restify.requestLogger( ));

  server.use(restify.dateParser( ));
  server.use(restify.queryParser( ));
  server.use(restify.gzipResponse( ));

  install(server, restify);

  return server;
}
module.exports = createServer;

if (!module.parent) {
  var port = process.env.PORT || 6776;
  var base = process.env.BASE || './out';
  var server = createServer(base);
  server.listen(port, function( ) {
    console.log('listening on', server.name, server.url);

  });
  server.on('after', restify.auditLogger({
    body: true,
    log: bunyan.createLogger({
      level: 'info',
      name: 'audit',
      stream: process.stdout
    })
  }));
}


