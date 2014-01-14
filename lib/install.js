
var Handlers = require('./handlers');
var Events = require('./events');

function install (server, opts) {
  console.log('installing routes');
  server.events = Events(opts);
  var handlers = Handlers(opts, server);
  handlers.mount(server);

  var experiments = require('./handlers/experiment')(opts, server);
  experiments.mount(server);

  return server;
}
install.install = install;
module.exports = install;
