
var helpers = require('./helpers');
var logs = require('../logger').logger;

function register (opts, server) {
  logs.log.info("Registering server wide listeners", module.id);
  function configure (hook, next) {
    hook.map(init);
    function init (data, fetch) {
      data = data.args.pop( );
      logs.log.info('default profile subscription data', data);
      fetch(null, data);
    }
    hook.map(helpers.findRepo);
    hook.map(helpers.findMaster);
    next( );
  }
  server.events.on('profile', configure);

  function fetchUser (name, next) {
    var profile = { name:name };
    var hook = server.events.process('profile', profile, next);
    hook.inject(server.events);
  }
  server.fetchUser = fetchUser;
  return fetchUser;

}
register.registered = false;

function configure (opts, server) {
  if (register.registered) { return; }
  server.fetchUser = opts.fetchUser ? opts.fetchUser : register(opts, server);
  register.registered = true;

}
module.exports = configure;
module.exports.register = register;
