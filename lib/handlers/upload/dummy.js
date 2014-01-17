var uploads = require('../../middleware/uploads')
  ;

function callbacks (profile, committer, msg) {
  var config = { };
  function getMessage (fn) {
    fn(msg);
  }
  function getAuthor (fn) {
    fn({name: profile.handle, email: profile.email});
  }
  function getCommitter (fn) {
    if (committer) {
      return fn({name: committer.name, email: committer.email});
    }
    return fn(null);
  }
  config.getMessage = getMessage;
  config.getAuthor = getAuthor;
  config.getCommitter = getCommitter;
  return config;
}

function handler (req, res, next) {
  var name = './out/test.git';
  console.log('files', req.files, req.body);
  var input = uploads.fileStream(req);
  var message = req.params.message || "my justification";
  var committer = req.params.committer || { };
  if (!committer || (!committer.user && !committer.email)) {
    committer = null;
  }
  var profile = { handle: 'tester', email: 'test@localhost' };
  var opts = callbacks(profile, committer, message);
  var git = gitStream(name, opts);
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

