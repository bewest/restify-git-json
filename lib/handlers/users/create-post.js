var middleware = require('../../middleware')
  , es = require('event-stream')
  , gitStream = require('../../stream-git')
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

      var incoming = {name: 'profile.json', content: JSON.stringify(profile) };
      var input = es.readArray([incoming]);
      var git = gitStream(req.repo);
      es.pipeline(input, git, es.writeArray( function (err, results) {
        var result = results.pop( );
        // result.url = req.profile.url;
        profile.url = req.profile.url;
        req.repo.setHead('master', function onMaster (err, master) {
          console.log('set to master', err, master);
          req.repo.updateHead(result.head.commit, function onUpdated (err, update) {
            console.log('updated master', 'err', err, 'update', update);
            profile.updated = result;
            res.send(201, profile);
            next( );
          });
        });
      }));
    }
    // TODO: info leak?
    res.send(405, {err: err, taken: ref});
    next( );
  });
}
var endpoint = {
    path: '/users/:user/create'
  , method: 'post'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  var userInfo = middleware.minUser(opts, server);
  var mandatory = middleware.mandatory(opts, server);
  endpoint.middleware = mandatory.concat(userInfo);
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

