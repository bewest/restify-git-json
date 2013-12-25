var middleware = require('../../middleware')
  , es = require('event-stream')
  ;

function handler (req, res, next) { }

var endpoint = {
    path: '/repos/:owner/:repo/git-upload-pack'
  , method: 'post'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = middleware.uploads(opts, server)
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

