
var restify = require('restify');
var clients = require('restify/lib/clients');
var es = require('event-stream');
var fs = require('fs');
var mimeStream = require('mime-multipart-stream');
var http = require('http');
function defaultContent ( ) {
  var fileOne = es.readArray(["dummy content hello world text"]);
  var fileTwo = fs.createReadStream('./README.markdown');
  var content = {fileOne: fileOne, fileTwo: fileTwo};
  return content;
}
function testContent (T) {
  var content = defaultContent( );
  var pre = "====";
  var boundary =  pre + pre + pre + "TIDEPOOL" + "TESTBOUNDARY" + "EOF";
  var stream = mimeStream({boundary: boundary, type: 'form-data'});
  function make (name, part) {
    var o = {
      disposition: 'form-data; name="' + name + '"; filename="'+ name + '"'
    , type: 'text/plain; charset=UTF-8'
    , transferEncoding: 'quoted-printable'
    , body: part
    };
    return o;
  }
  stream.add(make('testfileOne', content.fileOne));
  stream.add(make('testfileTwo', content.fileTwo));
  function message(m) {
    var o = {
      disposition: 'form-data; name="message";'
    , type: 'x-www-form-urlencoded'
    , transferEncoding: 'quoted-printable'
    , body: es.readArray([m])
    };
    stream.add(o);
  }
  stream.message = message;
  return stream;
}
function createClient (opts) {
  var client = restify.createJsonClient(opts);
  function help (fn) {
    return client.get('/help', fn);
  }
  function status (fn) {
    return client.get('/status', fn);
  }
  function userInfo (name, fn) {
    return client.get('/users/' + name, fn);
  }
  function updateUser (name, update, fn) {
    var url = '/users/' + name;
    return client.post(url, update, fn);
  }
  function createUser (name, update, fn) {
    var params = '?name=' + update.handle;
               + '&email=' + update.email;
    var url = '/users/' + name + '/create' + params;
    return client.post(url, update, fn);
  }
  function download (url, fn) {
    console.log("DOWNLOADING", url);
    url = url.replace('http://localhost', '');
    url = url.replace('http:/localhost', '');
    console.log("URL", url);
    client.get(url, function (err, res, req, body) {
      console.log("DOWNLOADING", url, body);
      fn(err, body);
    });
  }
  function uploadContent (profile, content, fn) {
    var name = profile.handle;
    var url = '/repos/' + name + '/test/upload';
    var config = {
      'content-type': 'multipart/form-data'
    , path: url
    // , url: url
    , method: 'POST' 
    };
    // options.
    // var mimes = testContent(content);
    var mimes = defaultContent(content);
    var fopts = {
      url: 'http://localhost:6776/'
    }
    var ropts = {
        method: 'POST'
      , uri: 'http://localhost/' + url
      //, uri: url
      , path: url
      // , socketPath: opts.socketPath
      // , host: 'localhost'
      // , port: 6776
      , socketPath: opts.socketPath
      // , headers: { //'content-type': 'multipart/form-data' }

    };
    /*
    var req = http.request(ropts, function up (res) {
    es.pipeline(mimes, req, es.writeArray(function (err, buffers) {
      console.log('INTER B', req);
      req.end( );
    }));
      es.pipeline(res, es.writeArray(done));
    });
    mimes.message('this is a personalized commit message');
    // mimes.pipe(req);
    // req.end( );
    req.on('error', done);
    return;
    */
    var request = require('request');
    var req = request.post(ropts, start);
    var form = req.form( );
    form.append("message", "this is my commit message");
    form.append('fileOne', mimes.fileOne, {filename: 'fileOne', knownLength: 30, contentType: 'text/plain'});
    form.append('fileTwo', mimes.fileTwo);
    function start (err, res, body) {
      console.log("UPLOADED BODY", err, body);
      fn(err, JSON.parse(body));
    }
    return;
    function done (err, result) {
      fn(err, JSON.parse(result[0]));
      
    }

  }
  function xxdownload (url) {

  }
  function downloadContent (content) {
  }
  client.help = help;
  client.status = status;
  client.userInfo = userInfo;
  client.createUser = createUser;
  client.updateUser = updateUser;
  client.uploadContent = uploadContent;
  client.download = download;
  return client;
}
module.exports.before = function ( ) {
}
describe("restify-git-json server", function ( ) {
  var Server = require('../server');
  var server, client;
  var opts = {
    base: './out'
  , socketPath: '/tmp/test-restify-git-json.sock'
  };
  this.profile = { };
  after(function (done) {
    server.close( );
    done( );
  });
  it('should initialize ok', function (done) {
    server = Server(opts);
    server.listen(opts.socketPath, function ( ) {
      client = createClient(opts);
      client.status(function (err, req, res, body) {
        console.log("STATUS", body);
        body.should.startWith("OK");
        done( );
      });
    });
  });
  it('should respond to help', function (done) {
    client.help(function (err, req, res, body) {
      console.log("HELP", arguments);
      body.length.should.be.above(1);
      done( );
    });
  });
  var profile;
  describe("users api", function ( ) {
    var my = { };
    this.profile = my;
    var foobarUser = { handle: 'fooTestUser'
      , user: { name: 'Foo Test User', email: 'test@tidepool.io' }
    };
    var client = createClient(opts);
    
    it('should create a new user', function (done) {
      testCreateUser(client, foobarUser, function (err, result) {
        my.profile = result;
        this.profile = result;
        done( );
      });
    });

    it('should not allow repeated user creation', function (done) {
      var name = my.profile.handle;
      client.createUser(name, my.profile, function (err, req, res, result) {
        console.log('REFUSAL', result);
        err.statusCode.should.equal(405);
        result.old.should.be.ok;
        done( );
      });
    });

    function validFetchUser (client, name, fn) {
      client.userInfo(client, name, function (err, req, res, body) {
        console.log("userInfo", body);
        body.should.be.ok;
        body.user.name.should.be.ok;
        my.profile = body;
        this.profile = body;
        console.log(this.profile);
        fn(err, body);
      });
    }

    it('should then update', function ( ) {
      console.log('should then update');
      testUpdateUser(done);
      function done (err, result) {
      }
    });

    it('should then upload', function (done) {
      testUploadContent(my.profile, finish);
      function finish (err, result) {
        console.log("DONE DONE", result);
        console.log("DONE ERR", err);
        result.body.should.exist;
        result.body.ref.should.exist;
        result.body.content.should.exist;
        console.log("DONE OK", result.body.head.tree);
        my.upload = result;
        done( );
      }
    });

    it('should then download content', function (done) {
        console.log("DOWNLOAD", my.upload);
        downloadContent(my.upload, function (err, results) {
          done( );
        });
    });

    it('should dereference urls', function (done) {
      var downloads;
      var urls = [ my.upload.body.head.url , my.upload.body.url ];
      urls.push(['/repos', my.profile.handle + 'xxx', 'create'].join('/'));
      urls.push(['/repos', my.profile.handle, 'test/git/refs'].join('/'));
      urls.push(['/repos', my.profile.handle, 'test/git/refs/'].join('/'));
      urls.push(['/repos', my.profile.handle, '/test'].join('/'));
      urls.push(['/repos', my.profile.handle].join('/'));
      downloads = walkDownload(more, finish);
      urls.forEach(downloads.write);
      downloads.end( );
      function finish (err, results) {
        done( );
      }
      function more (err, results) {
        console.log("MORE", results);
        if (results.result) {
          if (results.result.body) {
            var body = results.result.body;
            if (results.result.body && results.result.body.url) {
              downloads.write(body.url);
            }
            if (results.result.type == 'tree') {
              console.log('FOUND TREE', results, Object.keys(result.result));
              body = result.result;
            }

            var keys = Object.keys(body);
            console.log("MORE FOUND", body);
            keys.forEach(function (i, k) {
              if (body[i].url) {
                console.log("MORE URLS", body[i].url);
                downloads.write(body[i].url);
              }
            });
          }
        }
      }
    });
    function walkDownload (visit, fn) {
      // var urls = [ upload.body.head.url , upload.body.url ];
      var tr = es.through(write);
      function write(url) {
        var self = this;
        client.download(url, function (err, result) {
          var m = {err:err, url: url, result: result};
          crawl(err, m);
          self.emit('data', m);
        });
      }
      function down (url, next) {
        client.download(url, function (err, result) {
          var m = {err:err, url: url, result: result};
          crawl(err, m);
          next(null, m);
        });
      }
      function crawl (err, result) {
        console.log("CRAWL CRAWL", result);
        if (visit) {
          visit(err, result);
        }
      }
                    // es.readArray(urls),
      var stream = es.pipeline( tr, es.writeArray(done));
      function done(err, results) {
        fn(err, results);
      }
      return stream;
    }

    function downloadContent (download, fn) {

      es.pipeline(es.readArray(download.body.content)
        , es.map(fetch)
        , es.writeArray(done)
        );

      function fetch (url, next) {
        console.log("FETCH URL", url); 
        url = url.replace("http:/localhost", "");
        url = url.replace("http://localhost", "");
        console.log("FETCH URL", url); 
        client.get(url, function (err, req, res, body) {
          // console.log("FETCH FETCH", arguments);
          res.body.should.be.ok;
          next(null, res.body);
        });
      }

      function done (err, results) {
        download.downloaded = results;
        fn(err, results);
      }
    }

    function testUpdateUser (finish) {
      console.log("XXXXX");
      // it('should update user', function (done) {
        console.log("PROFILE FOR UPDATE", my.profile, this.profile);
        var update = JSON.parse(JSON.stringify(my.profile));
        var author = { name: "Bar Update", email: "updated@tidepool.io" };
        update.user.user = author;
        update.user.author = author;
        update.user.data = { custom: 'property' };
        update.user.user = JSON.parse(JSON.stringify(update.user))
        name = update.name;
        client.updateUser(name, update.user, function (err, req, res, result) {
          // console.log("UPDATED", result);
          result.name.should.equal(name);
          result.user.name.should.equal(update.user.name)
          result.user.data.should.be.ok;
          result.user.data.custom.should.equal(update.user.data.custom);
          if (finish) { finish(result); }
          // done( );
        });
      // });
    }

    function testUploadContent (profile, fn) {
    // describe("uploaded content", function ( ) {
        console.log("YYYY");
        // it('user should be able to upload content into git', function ( ) {
        client.uploadContent(profile, 'test', function (err, results) {
          console.log("UPLOADED", results);
          fn(err, results);
        });
        //});
    // });
    }

    it('should 404 non-existent users', function (done) {
      client.userInfo('xx-no-exist', function (err, req, res, body) {
        // console.log("404 ERR", 'error', err, 'body', body);
        // console.log("404 REQ", req);
        // console.log("404 RES", res);
        // body.should.be.ok;
        err.statusCode.should.equal(404);
        done( );
      });
    });
    describe("user creation REST api", function ( ) {
      var update = { };
      var client = createClient(opts);
      testCreateUser(client, null, function (err, result) {
        result.should.be.ok;
        // done( );
      });
    });
  });

});
function testCreateUser (client, update, fn) {
  update = update || ({ handle: 'testUser'
    , user: { name: 'Test User', email: 'test@tidepool.io' }
  });
  var left = 2;
  var R = { };
  function finish (err, result) {
    if (--left == 0) {
      console.log('LEFT', left, R);
      fn(R.err, R.result);
    }
  }
  // describe("user creation REST api", function ( ) {
    // it('should create a user', function (done) {
      var name = update.handle;
      client.createUser(name, update, function (err, req, res, result) {
        console.log('CREATED', result);
        result.handle.should.equal(name);
        result.user.name.should.equal(update.user.name);
        result.user.email.should.equal(update.user.email);
        result.should.be.ok;
        R.err = err;
        R.result = result;
        fn(err, result);
        // after( );
        // finish(err, result);
        // done( );
      });
    // });
    function after ( ) {
    describe("repeated creation", function ( ) {
    it('should not allow repeated user creation', function (done) {
      var name = my.profile.handle;
      client.createUser(name, update, function (err, req, res, result) {
        console.log('REFUSAL', result);
        err.statusCode.should.equal(405);
        result.old.should.be.ok;
        // fn(err, result);
        // finish(err, result);
      });
      done( );
    });
    });
    }
  // });
}
