
var subscribe = require('./default-fetch');

function register (opts, server) {
  console.log("Registering server wide listeners", module.id);
  registered = true;
  server.events.on('profile', function onProfile (hook, next) {
    hook.map(function each (data, fetch) {
      data = data.args.pop( );
      console.log('default profile subscription data', data);
      fetch(null, data);
    });
    next( );
  });

  function fetchUser (name, next) {
    var profile = { name:name };
    var hook = server.events.process('profile', profile, next);
    hook.inject(server.events);
  }
  server.fetchUser = fetchUser;

}
register.registered = false;

function configure (opts, server) {
  if (register.registered) { return; }
  if (opts.fetchUser) {
    server.fetchUser = opts.fetchUser;
  } else {
    register(opts, server);
    subscribe(opts, server);
  }
  register.registered = true;

}
module.exports = configure;
module.exports.register = register;
