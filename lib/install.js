
var gitStream = require('./stream-git');
var es = require('event-stream');
var fs = require('fs');
var formidable = require('formidable');

function fileList (req) {
  var keys = [ ];
  for (var key in req.files) {
    keys.push(req.files[key]);
  }
  return keys;
}

function fileStream (req) {
  return es.readArray(fileList(req));
}

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

function install (server, restify) {
  console.log('installing routes');
  server.get('/repos/:owner/:repo', function (req, res, next) {
    res.send({params: req.params, msg: 'hmm'});
  });

  server.get('/repos/:owner/', function (req, res, next) {
    res.send(["ha", req.params]);
  });
  server.post('/repo/test', restify.bodyParser( ), function (req, res, next) {
    var name = './out/test.git';
    console.log('files', req.files, req.body);
    var input = fileStream(req);
    var git = gitStream(name);
    es.pipeline(input, fileContentBlob( ), git,  es.writeArray( function (err, results) {
      console.log('error or results FINISH', err, results);

      res.send(201, {err: err, body: results})
    }));
    next( );
  });


  server.post('/repos/:owner/upload', function (req, res, next) {
    res.send("hahaha");
  });

  server.get('/repos/:owner/:repo/git/refs', function (req, res, next) {
    res.send("ha");
  });

  server.get('/repos/:owner/:repo/git/trees', function (req, res, next) {
    res.send("ha");
  });

  server.get('/repos/:owner/:repo/git/commits', function (req, res, next) {
    res.send("ha");
  });

  server.get('/repos/:owner/:repo/git/blob/:sha', function (req, res, next) {
    res.send("ha");
  });
  return server;
}
install.install = install;
module.exports = install;
