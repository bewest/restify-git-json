
var path = require('path');
var url = require('url');
var urlize = require('nurlize');

var join = path.join;
var normalize = path.normalize;

function isRelative (u) {
  return !u || (u && u.indexOf && u.indexOf('.') === 0);
}

function isAbsolutePath (u) {
  return !u || (u && u.indexOf && u.indexOf('/') === 0);
}

module.exports = function configure (opts, server) {
  // console.log("URLIZE", server.url);
  function getScheme(u) {
    var parts = u.split('//');
    if (parts.length > 1) {
      return [parts[0], parts.slice(1)];
    }
    return;
  }

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
