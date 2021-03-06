
var restify = require('restify')
  , es      = require('event-stream')
  , fs      = require('fs')
  // , formidable = require('formidable')
  ;
var logs = require('../api/logger').logger;
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
      content = Buffer.concat(content);
      var blob = { chunk: chunk, name: chunk.name, content: content };
      logs.log.debug(chunk.name, 'content', blob);
      cb(null, blob);
    }));
  }
  var stream = es.map(writer);
  return stream;
}


// TODO: maybe scrap this; was using it to eventually replace restify's upload mechanism
/*
function uploads (req, res, next) {
  var form = new formidable.IncomingForm();
  req.form = form.parse(req, function(err, fields, files) {
    req.body = fields;
    req.files = files;
  });
  next( );
}
*/

module.exports = function configure (opts, server) {
  return restify.bodyParser( );
};

module.exports.fileList = fileList;
module.exports.fileStream = fileStream;
module.exports.fileContentBlob = fileContentBlob;

