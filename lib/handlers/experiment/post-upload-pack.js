var middleware = require('../../middleware')
  , es = require('event-stream')
  , pktLine = require('git-pkt-line')
  ;

function handler (req, res, next) {
    console.log("req.repo", req.url, req.body);
    var service = 'git-upload-pack';
    res.setHeader('Expires', 'Fri, 01 Jan 1980 00:00:00 GMT');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/' + service + '-advertisement');
    // res.send(201, '');
    var incoming = es.through(function (chunk) { console.log(arguments); this.emit('data', chunk); } ).pause( );
    es.pipeline(req, incoming, es.writeArray( function (err, result) {
      console.log(arguments);
      res.send(201, '0000done');
      next( );
    }));
    incoming.resume( );
}

var endpoint = {
    path: '/repos/:owner/:repo/git-upload-pack'
  , method: 'post'
  , handler: handler
};
// foo(opts) - > { path, middleware, method, version, handler(req, res, next), mount(server) }
// server.get('/repos/:owner/:repo/git/refs', MIDDLE.all(opts, server), function (req, res, next) {
module.exports = function configure (opts, server) {
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = middleware.gitMiddle(opts, server);
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

