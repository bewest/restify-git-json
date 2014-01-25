
var Handlers = require('./handlers');
var Events = require('./events');
var api = {
    fetch: require('./api/users/fetch')
  , update: require('./api/users/update')
  , logger: require('./api/logger')
};
function install (server, opts) {
  console.log('installing routes');
  server.events = Events(opts);
  api.fetch(opts, server);
  api.update(opts, server);
  var handlers = Handlers(opts, server);
  handlers.mount(server);

  server.use(function installLoggers (req, res, next) {
    req.log = logger.log;
    res.log = logger.log;
    next( );
  });

  var experiments = require('./handlers/experiment')(opts, server);
  experiments.mount(server);

  return server;
}
install.install = install;
module.exports = install;
