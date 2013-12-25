
var gitStream = require('./stream-git');
var es = require('event-stream');
var fs = require('fs');
var formidable = require('formidable');
var path = require('path');

var decoders = require('js-git/lib/decoders');
var pktLine = require('git-pkt-line');
var repos = require('./repos');

var uploads = require('./middleware/uploads');

var getRepo = require ('./middleware/get-repo.js');

var repo_name = require('./middleware/repo-name')( );
var getPath = require('./middleware/repo-path');

var MIDDLE = require('./middleware');
var Handlers = require('./handlers');


var fixGitRequest = require('./middleware/fix-double-dot-git');

function install (server, opts) {
  console.log('installing routes');
  var handlers = Handlers(opts, server);
  handlers.mount(server);
  // var middleware = [ repo_name, getPath(opts), getRepo(opts) ];
  var middleware = MIDDLE.all(opts, server);
  var gitMiddleWare = [ repo_name, fixGitRequest(opts), getPath(opts),  getRepo(opts) ];
  // TODO: these should each move into their own module:
  // TODO: GET|POST /repos/:owner/create - preview, create new user
  // TODO: GET|POST /repos/:owner/:repo/create - preview, create new namespace per user


  var uploadBranch = require('./handlers/upload/branch')(opts, server);
  uploadBranch.mount(server);

  // TODO: GET|POST /repos/:owner/:repo/raw/:ref/:path - raw version of file

  var getRefs = require('./handlers/git/refs-get')(opts, server);
  getRefs.mount(server);

  // TODO: POST versions of these
  var getOneRef = require('./handlers/git/get-one-ref')(opts, server);
  getOneRef.mount(server);

  var getCommit = require('./handlers/git/get-commit')(opts, server);
  getCommit.mount(server);
  // TODO: POST

  var getTree = require('./handlers/git/get-tree')(opts, server);
  getTree.mount(server);
  // TODO: POST

  var getBlob = require('./handlers/git/get-blob')(opts, server);
  getBlob.mount(server);
  // TODO: POST

  var experiments = require('./handlers/experiment')(opts, server);
  experiments.mount(server);

  return server;
}
install.install = install;
module.exports = install;
