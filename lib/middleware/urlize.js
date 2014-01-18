
var path = require('path');
var url = require('url');

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

  return function (req, res, next) {
    var host = req.headers.host;
    var schemer = getScheme(server.url);
    schemer.pop( );
    schemer.push(host);
    var pathname = req.path( );
    console.log("HAS PATH", pathname);
    function u ( ) {
      var parts = Array.prototype.slice.apply(arguments);
      console.log('incoming U', arguments, parts);
      if (parts.length > 0) {
        var hint = parts[0];
        if (isRelative(hint)) {
          var head = schemer[1];
          parts.unshift(pathname);
          return schemer[0] + '//' + normalize(head + '/' + parts.join('/'));
        }
        if (isAbsolutePath(hint)) {
          console.log('ABSOLUTE', hint);
          return schemer[0] + '//' + normalize(schemer[1] + '/' + parts.join('/'));
        }
        var scheme = getScheme(parts[0]);
        if (scheme.length > 2 && scheme[0] && scheme[1]) {
          console.log('new scheme', scheme);
          schemer = scheme;
          return schemer[0] + '//' + normalize(schemer[1] + '/' + parts.slice(1).join('/'));
        }
        if (isAbsolutePath(hint)) {
          return schemer[0] + '//' + normalize(schemer[1] + '/' + parts.join('/'));
        }
      }
      return schemer[0] + '//' + normalize(schemer[1] + '/' + pathname + '/' + parts.join('/'));
    }
    req.urlize = u;
    next( );
  };
};
