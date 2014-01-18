
var userMiddle = require('../../middleware/users');
var urlize = require('../../middleware/urlize');

function handler (req, res, next) {
  res.send(200, req.profile);
}

var endpoint = {
    path: '/repos/:owner/'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function setName (req, res, next) {
    req.user = req.params.owner;
    next( );
  }
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = [urlize(opts, server), setName, userMiddle(opts, server) ];
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

