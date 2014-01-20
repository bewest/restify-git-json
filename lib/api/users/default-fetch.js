
var helpers = require('./helpers');
var findRepo = helpers.findRepo;
var findMaster = helpers.findMaster;

function subscribe (opts, server) {
  console.log("REGISTERING", module.id);

  function configure (hook, next) {
    hook.map(findRepo);
    hook.map(findMaster);
    next( );
  }
  server.events.on('profile', configure);
}
var api = {
    findRepo   : findRepo
  , findMaster : findMaster
};
module.exports = subscribe;
module.exports.api = api;
