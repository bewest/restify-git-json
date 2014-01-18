var middleware = require('../../middleware')
  ;

// var fetchUser;
// TODO: better error handling
function handler (req, res, next) {
  var ref = 'refs/heads/master/profile.json';
  var result = {params: req.params, input: ref};
  console.log("GET USER", req.user, req.profile);
  var profile = JSON.parse(JSON.stringify(req.profile));
  delete profile.repo;
  res.send(200, profile);
  return next( );
  
}

var endpoint = {
    path: '/users/:user'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
    if (!opts.fetchUser) {
      var subscribe = require('./defaultUser');
      subscribe(opts, server);
    }

    // fetchUser = server.fetchUser;
 }
  var userInfo = middleware.userInfo(opts, server);
  var mandatory = middleware.mandatory(opts, server);
  endpoint.middleware = mandatory.concat(userInfo);
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

