
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

  var middleware = [ repo_name, getPath(opts), getRepo(opts) ];
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


  // TODO: move to module middleware
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

  // TODO: GET|POST /repos/:owner/:repo/raw/:ref/:path - raw version of file

  var getRefs = require('./handlers/git/refs-get')(opts, server);
  getRefs.mount(server);

  // TODO: POST versions of these
  var getOneRef = require('./handlers/git/get-one-ref')(opts, server);
  getOneRef.mount(server);

  // TODO: POST, move to handlers
  server.get('/repos/:owner/:repo/git/commits/:sha', middleware, function (req, res, next) {
    var hash = req.params.sha;
    console.log('load commit', hash, 'repo', req.repo);
    var p = hash.slice(0, 2) + '/' + hash.slice(2);
    req.repo.load(hash,  function (err, commit) {
    // req.repo.load( hash, function (err, commit) {
      var inspect = server.url + path.join('/repos', req.params.owner,
                          req.params.repo, 'git', 'trees', commit.body.tree);
      commit.url = inspect;
      console.log('FOUND COMMIT', err, commit);
      res.send(200, {err: err, body: commit});

    });
    next( );
  });

  // TODO: POST, move to handlers
  server.get('/repos/:owner/:repo/git/trees/:sha', middleware, function (req, res, next) {
    var hash = req.params.sha;
    console.log('hash', hash, req.params, req);
    var inspect = path.join(req.url);
    req.repo.loadAs('tree', hash, function (err, tree) {
      console.log('FOUND COMMIT', tree);
      Object.keys(tree).forEach(function (blob) {
        var inspect = path.join('/repos', req.params.owner, req.params.repo, 'git', 'blobs', blob.hash )
        blob.url = inspect;
      });
      res.send(200, {err: err, body: tree, url: inspect});

    });
  });

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
  // TODO: move this to module.experimental.  It doesn't quite work and is in the middle of hacking.
  /*
  server.post('/repos/:owner/:repo/git-upload-pack', gitMiddleWare, function (req, res, next) {
    console.log("req.repo", req.url, req.body);
    var service = 'git-upload-pack';
    res.setHeader('Expires', 'Fri, 01 Jan 1980 00:00:00 GMT');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'application/' + service + '-advertisement');
    // res.send(201, '');
    var incoming = es.through(function (chunk) { console.log(arguments); this.emit('data', chunk); } ).pause( );
    es.pipeline(req, incoming, es.writeArray( function (err, result) {
      console.log(arguments);
      res.send(201, '0000done');
      next( );
    }));
    incoming.resume( );
  });
  */

  return server;
}
install.install = install;
module.exports = install;
