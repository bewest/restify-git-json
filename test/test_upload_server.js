
var restify = require('restify');
var clients = require('restify/lib/clients');
var es = require('event-stream');
var es = require('fs');
var mimeStream = require('mime-multipart-stream');
function testContent (T) {
  var fileOne = es.readArray(["dummy content hello world text"]);
  var fileTwo = fs.createReadStream('../README.markdown');
  var pre = "====";
  var boundary =  pre + pre + pre + "TIDEPOOL" + "TESTBOUNDARY" + "EOF";
  var content = {fileOne: fileOne, fileTwo: fileTwo};
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
    var url = '/users/' + name + '/create';
    return client.post(url, update, fn);
  }
  function uploadContent (profile, content, fn) {
    var name = profile.handle;
    var url = '/repos/' + name + '/test/upload';
    var config = {
      'content-type': 'multipart/form-data'
    };
    // options.
    var mimes = testContent(content);
    var str = restify.createHttpClient(opts);
    // function write (config, cb) { client.request(options, begin); }
    var req = str.post(config, begin);
    // req.on('error', error);
    // es.pipeline(mimes, req);
    // content.pipe(req);
    // return str.post.apply(client, post(url, content, start);
    function begin (err, req) {
      console.log("UPLOAD REQUEST", 'error', err, "RES", req);
      es.pipeline(mimes, req);
      req.on('result', done);
      req.on('error', error);
    }
    // var ERROR;
    function error (err, res) {
      // ERROR = err;
      console.log("ERROR ERROR", err);
      fn(err, null);
    }
    function done (err, res) {
      console.log("UPLOAD RESPONSE", 'error', err, "RES", res);
      es.pipeline(res, es.writeArray(fn));
      // fn(null, result);
    }
  }
  function download (url) {

  }
  function downloadContent (content) {
  }
  client.help = help;
  client.status = status;
  client.userInfo = userInfo;
  client.createUser = createUser;
  client.updateUser = updateUser;
  client.uploadContent = uploadContent;
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
    var foobarUser = { handle: 'fooTestUser'
      , user: { name: 'Foo Test User', email: 'test@tidepool.io' }
    };
    var client = createClient(opts);
    testCreateUser(client, foobarUser, onCreated);
    function onCreated (err, result) {
      it('should fetch a created user', function (done) {
        result.user.name.should.equal(foobarUser.user.name);
        done( );
      });
      testFetchUser(client, foobarUser.handle);
    }
    function testFetchUser (client, name) {
      it('should sync creation', function ( ) {
        it('should fetch a created user', function (done) {
          client.userInfo( function (err, req, res, body) {
            console.log("userInfo", body);
            body.should.be.ok;
            body.user.name.should.be.ok;
            profile = body;
            done( );
            // testUploadContent(pro);
          });
        });
        it('should then update', function (done) {
          console.log('should then update');
          testUpdateUser(done);
        });
        it('should then upload', function (done) {
          testUploadContent(profile, done);
          // done( );
        });
      })
    }

    function testUpdateUser (finish) {
      console.log("XXXXX");
      // it('should update user', function (done) {
        console.log("PROFILE FOR UPDATE", profile);
        var update = JSON.parse(JSON.stringify(profile));
        update.user.name = "Bar Update";
        update.user.email = "update@tidepool.io";
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
        it('user should be able to upload content into git', function ( ) {
          client.uploadContent(profile, 'test', function (err, results) {
            console.log("UPLOADED", results);
            fn(err, results);
          });
        });
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
      fn(R.err, R.result);
    }
  }
  // describe("user creation REST api", function ( ) {
    it('should create a user', function (done) {
      var name = update.handle;
      client.createUser(name, update, function (err, req, res, result) {
        console.log('CREATED', result);
        result.handle.should.equal(name);
        result.user.name.should.equal(update.user.name);
        result.user.email.should.equal(update.user.email);
        result.should.be.ok;
        R.err = err;
        R.result = result;
        done( );
        finish(err, result);
      });
    });
    it('should not allow repeated user creation', function (done) {
      var name = update.handle;
      client.createUser(name, update, function (err, req, res, result) {
        console.log('REFUSAL', result);
        err.statusCode.should.equal(405);
        result.old.should.be.ok;
        // fn(err, result);
        done( );
        finish(err, result);
      });
    });
  // });
}
