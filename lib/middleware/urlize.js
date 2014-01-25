
var urlize = require('nurlize');

module.exports = function configure (opts, server) {
  // console.log("URLIZE", server.url);
  return function middleware (req, res, next) {
    var init = urlize.valid(server.url);
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
