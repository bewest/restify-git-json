
var urlize = require('nurlize');

module.exports = function configure (opts, server) {
  // console.log("URLIZE", server.url);
  function origin ( ) {
    var parts = urlize.valid(server.url);
    var one = opts.scheme || opts.protocol ? ((opts.scheme || opts.protocol)+ '://')
            : parts[0];
    var two = opts.host ? (opts.host + ':' + opts.port) : parts[1];
    var three = parts[2] == '.' ? '/' : parts[2];
    var base = urlize(one, two, three)
    return base.urlize.apply(base, arguments);
  }
  server.urlize = origin;
  return function middleware (req, res, next) {
    var init = urlize.valid(origin( ));
    var host = req.headers.host || init[1];
    // XXX: revisit
    var scheme = opts.scheme || init[0];
    if (req.headers['hakken-service']) {
      scheme = 'hakken://';
      host = req.headers['hakken-service'] || opts.host;
    }
    req.urlize = urlize(scheme, host, req.path( )).urlize;
    next( );
  };
};
