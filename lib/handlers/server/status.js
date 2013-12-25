
var version = require('../../../package.json').version;
function handler (req, res, next) {
  res.send(200, "OK@" + version);
}

var endpoint = {
    path: '/status'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = [ ];
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

