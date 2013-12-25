
function handler (req, res, next) {
  res.send(["ha", req.params]);
}

var endpoint = {
    path: '/repos/:owner/'
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

