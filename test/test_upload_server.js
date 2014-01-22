
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
  function createUser (user, fn) {
    var url = '/users/' + user.handle + '';
    return client.post(url, user, fn);
  }
  function updateUser (name, update, fn) {
    var url = '/users/' + name;
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
  after(function (done) {
    server.close( );
    done( );
  });
  it('should initialize ok', function (done) {
    var opts = {
      base: './out'
    , socketPath: '/tmp/test-restify-git-json.sock'
    };
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
    it('should fetch user', function (done) {
      client.userInfo('foobar', function (err, req, res, body) {
        console.log("userInfo", body);
        body.should.be.ok;
        body.user.name.should.be.ok;
        profile = body;
        done( );
      });
    });
    it('should update user', function (done) {
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
  });

});
