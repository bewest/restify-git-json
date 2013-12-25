
module.exports = function configure (opts, server) {
  var endpoint = { };
  // handlers/<...>/foo
  // foo(opts) - > { path, middleware, method, version, handler(req, res, next), mount(server) }
  var getStatus = require('./server/status')(opts, server);
  var getRepoInfo = require('./server/repo-info')(opts, server);
  var getOwnerInfo = require('./server/owner-info')(opts, server);
  var testUpload = require('./upload/dummy')(opts, server);

  function mount (server) {
    // server.get(endpoint.path, endpoint.middleware, endpoint.handler);
    getStatus.mount(server);
    getRepoInfo.mount(server);
    getOwnerInfo.mount(server);
    testUpload.mount(server);
  }
  // endpoint.middleware = middleware.all(opts, server)
  endpoint.mount = mount;

  return endpoint;
};

