
var middleware = require('../../middleware')
  , es = require('event-stream')
  , pktLine = require('git-pkt-line')
  ;

function handler (req, res, next) {
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
}

var endpoint = {
    path: '/repos/:owner/:repo/info/refs'
  , method: 'get'
  , handler: handler
};
// foo(opts) - > { path, middleware, method, version, handler(req, res, next), mount(server) }
// server.get('/repos/:owner/:repo/git/refs', MIDDLE.all(opts, server), function (req, res, next) {
module.exports = function configure (opts, server) {
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, endpoint.handler);
  }
  endpoint.middleware = middleware.gitMiddle(opts, server);
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

