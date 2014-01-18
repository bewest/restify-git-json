
var gitServer = require('../server');

function customUser (profile, next) {
  // customize description
  // actually you can replace the entire thing, supports async fetching.
  profile.description = "Hello world!";
  // what ever is passed to next will be the result of server.fetchUser(name, cb)
  next(null, profile);
}

function configure (hook, next) {
  hook.map(customUser);
  next( );
}

function createServer( ) {
  var env = require('../env');
  var server = gitServer(env);

  server.events.on('profile', configure);
  return server;
}

module.exports = createServer;

if (!module.parent) {
  console.log('main');
  var server = createServer( );

  var env = require('../env');
  var port = env.port || 6886;
  server.listen(port, function( ) {
    console.log('listening on', server.name, server.url);
  });

}

