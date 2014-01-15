
module.exports = function configure (opts, server) {
  var endpoint = { };
  // handlers/<...>/foo
  // foo(opts) - > { path, middleware, method, version, handler(req, res, next), mount(server) }

  endpoint.modules = [
    './server/status'
  , './server/repo-info'
  , './server/owner-info'
  , './upload/dummy'
  // TODO: GET|POST /repos/:owner/create - preview, create new user
  // TODO: GET|POST /repos/:owner/:repo/create - preview, create new namespace per user
  , './upload/branch'
  // TODO: GET|POST /repos/:owner/:repo/raw/:ref/:path - raw version of file
  , './git/refs-get'
  // TODO: POST versions of these
  , './git/get-one-ref'
  , './git/get-commit'
  // TODO: POST
  , './git/get-tree'
  // TODO: POST
  , './git/get-blob'
  // TODO: POST
  , './raw/cat-file'
  , './help'
  ];
  endpoint.all = [ ];

  function Handler (path) {
    return require(path)(opts, server);
  }
  function make (mod) {
    endpoint.all.push(Handler(mod));
  }
  endpoint.modules.forEach(make);

  /*
  var getStatus = require('./server/status')(opts, server);
  var getRepoInfo = require('./server/repo-info')(opts, server);
  var getOwnerInfo = require('./server/owner-info')(opts, server);
  var testUpload = require('./upload/dummy')(opts, server);
  // TODO: GET|POST /repos/:owner/create - preview, create new user
  // TODO: GET|POST /repos/:owner/:repo/create - preview, create new namespace per user
  var uploadBranch = require('./upload/branch')(opts, server);
  // TODO: GET|POST /repos/:owner/:repo/raw/:ref/:path - raw version of file
  var getRefs = require('./git/refs-get')(opts, server);
  // TODO: POST versions of these
  var getOneRef = require('./git/get-one-ref')(opts, server);
  var getCommit = require('./git/get-commit')(opts, server);
  // TODO: POST
  var getTree = require('./git/get-tree')(opts, server);
  // TODO: POST
  var getBlob = require('./git/get-blob')(opts, server);
  // TODO: POST
  var catFile = require('./raw/cat-file')(opts, server);
  */

  function mount (server) {
    // server.get(endpoint.path, endpoint.middleware, endpoint.handler);
    function make (handler) {
      handler.mount(server);
    }
    endpoint.all.forEach(make);
    server.endpoints = endpoint.all;
    
    /*
    getStatus.mount(server);
    getRepoInfo.mount(server);
    getOwnerInfo.mount(server);
    testUpload.mount(server);
    uploadBranch.mount(server);
    getRefs.mount(server);
    getOneRef.mount(server);
    getCommit.mount(server);
    getTree.mount(server);
    getBlob.mount(server);
    catFile.mount(server);
    */
  }
  // endpoint.middleware = middleware.all(opts, server)
  endpoint.mount = mount;

  return endpoint;
};

