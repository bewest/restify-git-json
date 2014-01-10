var middleware = require('../../middleware')
  , es = require('event-stream')
  , path = require('path')
  , gitStream = require('../../stream-git')
  , uploads = require('../../middleware/uploads')
  ;

function handler (req, res, next) {
  console.log(req.repo_path, req.repo_name, 'files', req.files, req.body, 'to repo', req.repo);
  var input = uploads.fileStream(req);
  var git = gitStream(req.repo);
  es.pipeline(input, uploads.fileContentBlob( ), git,  es.writeArray( function (err, results) {
    var result = results[0];
    var url = req.urlize('../git/refs/heads/' + result.ref)
    var commit = req.urlize('../git/commits/' + result.head.commit);
    var tree = req.urlize('../git/trees/' + result.head.tree.tree);
    var content = [ ];
    for (var k in req.files) {
      content.push(req.urlize(['../raw', result.ref, req.files[k].name].join('/')));
    };
    result.content = content;
    result.url = url;
    result.head.url = commit;
    result.head.tree.url = tree;

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

