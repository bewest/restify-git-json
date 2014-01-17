
var registered = false;
function register (opts, server) {
  if (registered) { return; }
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
    next({name: name});
  }
  if (opts.fetchUser) {
    server.fetchUser = opts.fetchUser;
  } else {
    function setup (name, cb) {
      fetchUser(name, prime);
      function prime (profile) {
        defaultUser(profile, cb);
      }
    }
    function defaultUser (profile, next) {
      var hook = server.events.process('profile', profile, next);
      hook.inject(server.events);
    }
    server.fetchUser = setup;
  }
}

module.exports = function configure (opts, server) {
  register(opts, server);

  return function middleware (req, res, next) {
    if (req.user) {
      function onResults (profile) {
        req.profile = profile;
        // TODO: fix with urlize
        var base = 'http://' + req.headers.host;
        console.log('ppp', profile, profile.name);
        profile.url = base + ['/users', req.user ].join('/');
        next( );
      }
      console.log('fetch user', req.user);
      server.fetchUser(req.user, onResults);
      /*
      fetchUser(req.user, function done (profile) {
        req.profile = profile;
        var hook = server.events.process('profile', profile, onResults);
        hook.inject(server.events);
      });
      */
    } else { next( ); }
  }
}
