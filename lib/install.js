
var gitStream = require('./stream-git');
var es = require('event-stream');
var fs = require('fs');
var formidable = require('formidable');
var path = require('path');

var decoders = require('js-git/lib/decoders');
var pktLine = require('git-pkt-line');
var repos = require('./repos');


// TODO: move to middleware
// TODO: factory function should return this configured for opts
function fileList (req) {
  var keys = [ ];
  for (var key in req.files) {
    keys.push(req.files[key]);
  }
  return keys;
}

// TODO: move to middleware
// TODO: factory function should return this configured for opts
function fileStream (req) {
  return es.readArray(fileList(req));
}

// TODO: move to middleware
function fileContentBlob ( ) {
  function writer (chunk, cb) {
    var input = fs.createReadStream(chunk.path);
    input.pipe(es.writeArray(function (err, content) {
      content = content[0].toString( );
      var blob = { chunk: chunk, name: chunk.name, content: content };
      console.log(chunk.name, 'content', blob);
      cb(null, blob);
    }));
  }
  var stream = es.map(writer);
  return stream;
}



// TODO: move to middleware
// TODO: maybe scrap this; was using it to eventually replace restify's upload mechanism
function uploads (req, res, next) {
  var form = new formidable.IncomingForm();
  console.log('parsing');
  req.form = form.parse(req, function(err, fields, files) {
    req.body = fields;
    console.log('err', err);
    console.log('found files', files);
    console.log('found fields', fields);
    req.files = files;
  });
  next( );
}

// TODO: move to middleware
function getRepo (opts) {
  var createRepo = repos(opts);
  return (function (req, res, next) {
    req.repo = createRepo(req.repo_path);
    next( );
  });

}

// TODO: move to middleware
/*
function repo_name (req, res, next) {
  req.repo_name = req.params.repo + '.git';
  next( );
};
*/
var repo_name = require('./middleware/repo-name')( );

// TODO: move to middleware
function getPath (opts) {
  var path = require('path');
  return function (req, res, next) {
    req.repo_path = path.join(opts.base, req.params.owner, req.repo_name);
    console.log("GIT PATH", req.repo_path);
    next( );
  };
}

// TODO: move to middleware
function fixGitRequest (opts) {
  var candidate = /\.git\.git$/;
  return  function (req, res, next) {
    console.log("GIT REQUEST", req.repo_name, candidate.test(req.repo_name), req.url);
    if (candidate.test(req.repo_name)) {
      req.repo_name = req.repo_name.replace(candidate, '.git');
      console.log("GIT REQUEST REPLACED:", req.repo_name);
    }
    next( );
  };
};

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
  // modules/<...>/foo
  // foo(opts) - > { path, middleware, version, handler(req, res, next), mount(server) }
  server.get('/repos/:owner/:repo', repo_name, getPath(opts), getRepo(opts), function (req, res, next) {
    req.repo.listRefs("refs/heads", function (err, refs) {
      res.send(200, {params: req.params, msg: 'hmm', name: req.repo_name, path: req.repo_path, repo: req.repo, body: refs});

    });
  });

  server.get('/repos/:owner/', function (req, res, next) {
    res.send(["ha", req.params]);
  });
  // TODO: move test stuff somewhere else
  server.post('/repo/test', opts.bodyParser( ), function (req, res, next) {
    var name = './out/test.git';
    console.log('files', req.files, req.body);
    var input = fileStream(req);
    var git = gitStream(name);
    es.pipeline(input, fileContentBlob( ), git, es.writeArray( function (err, results) {
      console.log('error or results FINISH', err, results);

      res.send(201, {err: err, body: results})
    }));
    next( );
  });

  // TODO: GET|POST /repos/:owner/create - preview, create new user
  // TODO: GET|POST /repos/:owner/:repo/create - preview, create new namespace per user


  // TODO: move to module middleware
  server.post('/repos/:owner/:repo/upload', repo_name, getPath(opts), getRepo(opts), opts.bodyParser( ), function (req, res, next) {
    console.log(req.repo_path, req.repo_name, 'files', req.files, req.body, 'to repo', req.repo);
    var input = fileStream(req);
    var git = gitStream(req.repo);
    es.pipeline(input, fileContentBlob( ), git,  es.writeArray( function (err, results) {
      console.log('error or results FINISH', err, results);

      res.send(201, {err: err, body: results})
    }));
    next( );
  });

  // TODO: GET|POST /repos/:owner/:repo/raw/:ref/:path - raw version of file

  // TODO: POST, move to modules
  server.get('/repos/:owner/:repo/git/refs', middleware, function (req, res, next) {
    console.log('REPO', req.repo);
    req.repo.db.keys('refs/', console.log);
    req.repo.listRefs('refs/',  function (err, refs) {
      console.log("REFS", err, refs);
      var keys = Object.keys(refs);
      console.log('keys', keys);
      // TODO: redo all URL handling.
      // TODO: create middleware, takes config creates function urlize
      refs.url = server.url + path.join(req.path( ));
      var results = [ ];
      keys.forEach(function (key) {
        var item = refs[key];
        console.log('each', key, item);
        var r = {
          ref: key,
          sha: item,
          url: server.url + path.join('/repos', req.params.owner, req.params.repo, 'git', key)
        };
        results.push(r);
        // item.url  = path.join(server.url, item.type + 's', item.body.tree);
      });
      res.send(200, {err: err, body: results});

    });
  });

  // TODO: POST, move to modules
  server.get('/repos/:owner/:repo/git/refs/(.*)', middleware, function (req, res, next) {
    var ref = 'refs';
    var pattern = /refs\/(.*)/;
    var hashish = req.path( ).match(pattern);
    if (hashish && hashish.length > 1) ref = hashish[0];
    console.log('result', hashish);
    console.log('ref', ref, 'url', req.url, req.path(/refs/), 'params', req.params, req.params[0]);
    // req.repo.load(ref, function (err, refs) {
    req.repo.readRef(ref, function (err, hash) {
      req.repo.load(hash, function (err, refs) {
        console.log("REFS", refs);
        var inspect = server.url + path.join('/repos', req.params.owner,
                            req.params.repo, 'git', refs.type + 's', hash);
        var o = {type: refs.type, sha: refs.body.tree, url: inspect};
        res.send(200, {err: err, body: o});
      });

    });
  });

  // TODO: POST, move to modules
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

  // TODO: POST, move to modules
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

  // TODO: POST, move to modules
  server.get('/repos/:owner/:repo/git/blobs/:sha', middleware, function (req, res, next) {
    var hash = req.params.sha;
    req.repo.loadAs('text', hash, function (err, blob) {
      console.log('blob', blob);
      var b = blob;
      var o = {err: err, content: b, size: blob.length, encoding: 'utf-8' };
      res.send(o);
    });
  });

  // TODO: move this to module.experimental.  It doesn't quite work and is in the middle of hacking.
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
  // TODO: move to module.experimental.git-upload-pack-advertisement
  // works with ls-remote, and provokes git clone to attempt POSTing a want list.
  server.get('/repos/:owner/:repo/info/refs', gitMiddleWare, function (req, res, next) {
    res.setHeader('Expires', 'Fri, 01 Jan 1980 00:00:00 GMT');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    if (req.params.service) {
      var service = req.params.service;
      res.setHeader('Content-Type', 'application/' + service + '-advertisement');
      console.log('SERVICE', service);
      var packet = "# service=" + service + "\n";
      var length = packet.length + 4;
      var hex = "0123456789abcdef";
      var prefix = hex.charAt((length >> 12) & 0xf);
      prefix = prefix + hex.charAt((length >> 8) & 0xf);
      prefix = prefix + hex.charAt((length >> 4) & 0xf);
      prefix = prefix + hex.charAt(length & 0xf);
      var head = prefix + packet + "\u0000";
      var result = [ ];
      // result.push(head);
      var tr = es.through( ).pause( );
      tr.on('end', function ( ) { });
      es.pipeline(tr, res);
      // tr.pipe(res);
      tr.resume( );
      var firstref = 'true';
      if (service == 'git-upload-pack') {
        console.log("REPO", req.repo);
        
        var writePkt = pktLine.framer(function (item) {
          console.log('framed', item);
          tr.write(item);
        });
        writePkt('line', '# service=' + service + "\n");
        writePkt('line', null);
        // req.repo.listRefs("refs", function (err, refs) {
        var read = (function () {
        });
        req.repo.listRefs("refs/", function (err, refs) {
          console.log('REFS', err, refs);
          var keys = Object.keys(refs);
          keys.sort( ).forEach(function (ref, i) {
            var item = refs[ref] + " " + ref;
            if (i == 0) {
              item = item + "\0no-progress side-band side-band-64k ofs-delta";
            }
            if (i == keys.length - 1) {
              item = item + '^{}';
            }
            result.push(item);
            console.log('EACH ITEM', i, item);
            writePkt('line', item + "\n");
            // tr.write(item);
          });
          writePkt('line', null);
          // writePkt('line', '\000');
          // writePkt('line', null);
          tr.end( );
          next( );
            // result.push('\u0000');
        });
      }
      // res.end( );
    }
    console.log("REQ", req.url);
  });
  return server;
}
install.install = install;
module.exports = install;
