var middleware = require('../../middleware')
  ;

function handler (req, res, next) {
  req.repo.listRefs("refs/heads", function (err, refs) {
    res.send(200, {params: req.params, msg: 'hmm', name: req.repo_name, path: req.repo_path, repo: req.repo, body: refs});

  });
}

var endpoint = {
    path: '/repos/:owner/:repo'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = middleware.all(opts, server)
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

