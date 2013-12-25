
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


var fixGitRequest = require('./middleware/fix-double-dot-git');

function install (server, opts) {
  console.log('installing routes');
  var createRepo = repos(opts);
  var version = require('../package.json').version;
  server.get('/status', function (req, res, next) {
    res.send(200, "OK@" + version);
  });

  // var middleware = [ repo_name, getPath(opts), getRepo(opts) ];
  var middleware = MIDDLE.all(opts, server);
  var gitMiddleWare = [ repo_name, fixGitRequest(opts), getPath(opts),  getRepo(opts) ];
  // TODO: these should each move into their own module:
  // handlers/<...>/foo
  // foo(opts) - > { path, middleware, method, version, handler(req, res, next), mount(server) }
  server.get('/repos/:owner/:repo', repo_name, getPath(opts), getRepo(opts), function (req, res, next) {
    req.repo.listRefs("refs/heads", function (err, refs) {
      res.send(200, {params: req.params, msg: 'hmm', name: req.repo_name, path: req.repo_path, repo: req.repo, body: refs});

    });
  });

  server.get('/repos/:owner/', function (req, res, next) {
    res.send(["ha", req.params]);
  });
  // TODO: move test stuff somewhere else
  // var testUpload = require('./handlers/upload/test')(opts, server);
  // testUpload.mount(server);
  server.post('/repo/test', uploads( ), function (req, res, next) {
    var name = './out/test.git';
    console.log('files', req.files, req.body);
    var input = uploads.fileStream(req);
    var git = gitStream(name);
    es.pipeline(input, uploads.fileContentBlob( ), git, es.writeArray( function (err, results) {
      console.log('error or results FINISH', err, results);

      res.send(201, {err: err, body: results})
    }));
    next( );
  });

  // TODO: GET|POST /repos/:owner/create - preview, create new user
  // TODO: GET|POST /repos/:owner/:repo/create - preview, create new namespace per user


  var uploadBranch = require('./handlers/upload/branch')(opts, server);
  uploadBranch.mount(server);
  // TODO: move to module middleware
  /*
  server.post('/repos/:owner/:repo/upload', repo_name, getPath(opts), getRepo(opts), uploads( ), function (req, res, next) {
    console.log(req.repo_path, req.repo_name, 'files', req.files, req.body, 'to repo', req.repo);
    var input = uploads.fileStream(req);
    var git = gitStream(req.repo);
    es.pipeline(input, uploads.fileContentBlob( ), git,  es.writeArray( function (err, results) {
      console.log('error or results FINISH', err, results);

      res.send(201, {err: err, body: results})
    }));
    next( );
  });
  */

  // TODO: GET|POST /repos/:owner/:repo/raw/:ref/:path - raw version of file

  var getRefs = require('./handlers/git/refs-get')(opts, server);
  getRefs.mount(server);

  // TODO: POST versions of these
  var getOneRef = require('./handlers/git/get-one-ref')(opts, server);
  getOneRef.mount(server);

  var getCommit = require('./handlers/git/get-commit')(opts, server);
  getCommit.mount(server);
  // TODO: POST, move to handlers
  /*
  server.get('/repos/:owner/:repo/git/commits/:sha', middleware, function (req, res, next) {
    var hash = req.params.sha;
    console.log('load commit', hash, 'repo', req.repo);
    var p = hash.slice(0, 2) + '/' + hash.slice(2);
    req.repo.load(hash,  function (err, commit) {
    // req.repo.load( hash, function (err, commit) {
      var inspect = req.urlize(['/repos', req.params.owner,
                          req.params.repo, 'git', 'trees', commit.body.tree].join('/'));
      commit.url = inspect;
      console.log('FOUND COMMIT', err, commit);
      res.send(200, {err: err, body: commit});

    });
    next( );
  });
  */

  var getTree = require('./handlers/git/get-tree')(opts, server);
  getTree.mount(server);
  // TODO: POST, move to handlers
  /*
  server.get('/repos/:owner/:repo/git/trees/:sha', middleware, function (req, res, next) {
    var hash = req.params.sha;
    console.log('hash', hash, req.params, req);
    req.repo.loadAs('tree', hash, function (err, tree) {
      console.log('FOUND COMMIT', tree);
      Object.keys(tree).forEach(function (blob) {
        var leaf = tree[blob];
        var inspect = req.urlize(['/repos', req.params.owner, req.params.repo, 'git', 'blobs', leaf.hash ].join('/'));
        leaf.url = inspect;
      });
      res.send(200, {err: err, body: tree, url: req.urlize( )});

    });
  });
  */

  // var getBlob = require('./handlers/git/get-blob')(opts, server);
  // getBlob.mount(server);
  // TODO: POST, move to handlers
  server.get('/repos/:owner/:repo/git/blobs/:sha', middleware, function (req, res, next) {
    var hash = req.params.sha;
    req.repo.loadAs('text', hash, function (err, blob) {
      console.log('blob', blob);
      var b = blob;
      var o = {err: err, content: b, size: blob.length, encoding: 'utf-8' };
      res.send(o);
    });
  });

  var experiments = require('./handlers/experiment')(opts, server);
  experiments.mount(server);

  return server;
}
install.install = install;
module.exports = install;
