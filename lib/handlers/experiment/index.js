var middleware = require('../../middleware')
  ;


var getUploadPack = require('./get-upload-pack');
module.exports = function configure (opts, server) {
  var endpoint = { };
  var uploadPack = getUploadPack(opts, server);
  function mount (server) {
    // server.get(endpoint.path, endpoint.middleware, endpoint.handler);
    uploadPack.mount(server);

  }
  endpoint.middleware = middleware.gitMiddle(opts, server);
  endpoint.mount = mount;

  return endpoint;
};
// module.exports.endpoint = endpoint;

