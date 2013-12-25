
var middleware = require('../../middleware')
  ;

function handler (req, res, next) {
  var hash = req.params.sha;
  console.log('load commit', hash, 'repo', req.repo);
  var p = hash.slice(0, 2) + '/' + hash.slice(2);
  req.repo.load(hash,  function (err, commit) {
    var inspect = req.urlize(['/repos', req.params.owner,
                        req.params.repo, 'git', 'trees', commit.body.tree].join('/'));
    commit.url = inspect;
    console.log('FOUND COMMIT', err, commit);
    res.send(200, {err: err, body: commit});

  });
  next( );
}
  /*
  server.get(, middleware,
  );
  */

var endpoint = {
    path: '/repos/:owner/:repo/git/commits/:sha'
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

