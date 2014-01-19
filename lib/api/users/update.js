
var helpers = require('./default-update');

function register (opts, server) {
  function prime (user, next) {
    server.fetchUser(user, next);
  }
  function updateUser (user, update, opts, done) {

    console.log("UPDATE PROFILE", user, update);
    // XXX
    console.log('DONISH????', done);
    var hook = server.events.process('update.profile', user, update, done);
    hook.opts = opts;
    hook.inject(server.events);
  }
  server.updateUser = updateUser;
  server.events.on('update.profile', function onProfile (hook, next) {
    hook.map(function each (data, fetch) {
      console.log('default update profile subscription data', data, arguments);
      update = data.args.pop( );
      profile = data.args.pop( );
      // XXX
      prime(profile, begin);
      function begin (profile) {
        console.log("UPDATE PROFILE", 'found user');
        profile = helpers.applyDelta(profile, update);
        fetch(null, profile);
      }
    });
    // hook.map(helpers.applyDelta);
    if (hook.opts && hook.opts.save) {
      hook.map(helpers.saveDelta);
    }
    
    next( );
  });
}
register.registered = false;

function configure (opts, server) {
  if (register.registered) { return; }
  if (opts.updateUser) {
    server.updateUser = opts.updateUser;
  } else {
    register(opts, server);
    // subscribe(opts, server);
  }
  register.registered = true;

}
module.exports = configure;
module.exports.register = register;
