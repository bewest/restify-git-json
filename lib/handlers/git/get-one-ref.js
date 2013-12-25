var middleware = require('../../middleware')
  ;

function handler () { }
  /*
  server.get('/repos/:owner/:repo/git/refs/(.*)', MIDDLE.all(opts, server), function (req, res, next) {
    var ref = 'refs';
    var pattern = /refs\/(.*)/;
    var hashish = req.path( ).match(pattern);
    if (hashish && hashish.length > 1) ref = hashish[0];
    console.log('result', hashish);
    console.log('ref', ref, 'url', req.urlize( ), 'params', req.params, req.params[0]);
    // req.repo.load(ref, function (err, refs) {
    req.repo.readRef(ref, function (err, hash) {
      req.repo.load(hash, function (err, refs) {
        console.log("REFS", refs);
        var inspect = req.urlize(path.join('/repos', req.params.owner, req.params.repo
                                 , 'git', refs.type + 's', hash));
        var o = {type: refs.type, sha: refs.body.tree, url: inspect};
        res.send(200, {err: err, body: o});
      });

    });
  });

*/

var endpoint = {
    path: '/repos/:owner/:repo/git/refs'
  , method: 'get'
  , handler: handler
};
// foo(opts) - > { path, middleware, method, version, handler(req, res, next), mount(server) }
// server.get('/repos/:owner/:repo/git/refs', MIDDLE.all(opts, server), function (req, res, next) {
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = middleware.all(opts, server);
  endpoint.mount = mount;
   
  return endpoint;
};
module.exports.endpoint = endpoint;

