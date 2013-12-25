var uploads = require('../../middleware/uploads')
  ;

function handler (req, res, next) {
  var name = './out/test.git';
  console.log('files', req.files, req.body);
  var input = uploads.fileStream(req);
  var git = gitStream(name);
  es.pipeline(input, uploads.fileContentBlob( ), git, es.writeArray( function (err, results) {
    console.log('error or results FINISH', err, results);

    res.send(201, {err: err, body: results})
  }));
  next( );
}

var endpoint = {
    path: '/repo/test'
  , method: 'post'
  , handler: handler
};
module.exports = function configure (opts, server) {
  function mount (server) {
    server.post(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = uploads( );
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

