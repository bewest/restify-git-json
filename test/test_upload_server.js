
var restify = require('restify');
var es = require('event-stream');
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
    var url = '/repos/' + profile.handle + '/test/upload';
    return client.post(url, content, fn);
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
      it('should fetch a created user', function (done) {
        client.userInfo( function (err, req, res, body) {
          console.log("userInfo", body);
          body.should.be.ok;
          body.user.name.should.be.ok;
          profile = body;
          done( );
          testUpdateUser( );
        });
      });
    }
    function testUpdateUser ( ) {
      it('should update user', function (done) {
        console.log("PROFILE FOR UPDATE", profile);
        var update = JSON.parse(JSON.stringify(profile));
        update.user.name = "Bar Update";
        update.user.data = { custom: 'property' };
        update.user.user = JSON.parse(JSON.stringify(update.user))
        name = update.name;
        client.updateUser(name, update.user, function (err, req, res, result) {
          // console.log("UPDATED", result);
          result.name.should.equal(name);
          result.user.name.should.equal(update.user.name)
          result.user.data.should.be.ok;
          result.user.data.custom.should.equal(update.user.data.custom);
          done( );
        });
      });
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
  describe("user creation REST api", function ( ) {
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
  });
}
