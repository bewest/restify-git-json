var middleware = require('../../middleware')
  , es = require('event-stream')
  , gitStream = require('../../stream-git')
  , uploads = require('../../middleware/uploads')
  ;

function handler (req, res, next) {
  console.log(req.repo_path, req.repo_name, 'files', req.files, req.body, 'to repo', req.repo);
  var input = uploads.fileStream(req);
  var git = gitStream(req.repo);
  es.pipeline(input, uploads.fileContentBlob( ), git,  es.writeArray( function (err, results) {
    console.log('error or results FINISH', err, results);

    res.send(201, {err: err, body: results})
  }));
  next( );
}
  /*
  server.post(, repo_name, getPath(opts), getRepo(opts), uploads( ), function
  );
  */

var endpoint = {
    path: '/repos/:owner/:repo/upload'
  , method: 'post'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = middleware.uploads(opts, server)
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

