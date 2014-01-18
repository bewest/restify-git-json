var middleware = require('../../middleware')
  ;
function handler (req, res, next) {
  var profile = { };
  function valid (field, value) {
    return value || profile[field];
  }
  function install (each, root) {
    return function (key) {
      console.log("KEY", key, root[key]);
      return (profile[key] = each(key, root[key]));
    }
  }
  var keys = ['name', 'handle', 'email'];
  req.repo.load('master', function (err, ref) {
    console.log('on LOAD', err, ref);
    // don't allow repeated creation
    if (err && err.code == 'ENOENT') {

      req.profile.handle = req.params.user;
      keys.forEach(install(valid, req.profile))
      keys.forEach(install(valid, req.params))
      res.send(200, profile);
    }
    next( );
  });
}
var endpoint = {
    path: '/users/:user/create'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  var userInfo = middleware.minUser(opts, server);
  var mandatory = middleware.mandatory(opts, server);
  endpoint.middleware = mandatory.concat(userInfo);
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

