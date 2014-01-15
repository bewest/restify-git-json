
var version = require('../../../package.json').version;
function handler (req, res, next) {
  var docs = [ ];
  function Doc (endpoint) {
    var doc = {
      'path': endpoint.path
    , 'version': endpoint.version || version
    , 'middleware': endpoint.middleware.length
    , 'handler': endpoint.handler
    }
    console.log(endpoint);
    docs.push(doc);
    return doc;

  }
  req.help.forEach(Doc);
  res.send(200, docs);
}

var endpoint = {
    path: '/help/'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  function help (req, res, next) {
    req.help = server.endpoints;
    next( );
  }
  endpoint.middleware = [help];
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

