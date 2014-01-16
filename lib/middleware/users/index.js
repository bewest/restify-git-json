
var registered = false;
module.exports = function configure (opts, server) {
  if (!registered) {
    server.events.on('profile', function onProfile (hook, next) {
      hook.map(function each (data, fetch) {
        console.log('before pop');
        data = data.args.pop( );
        console.log('after pop');
        fetch(null, hook.value(data));
      });
      next( );
    });
    registered = true;
  }
  function fetchUser (name, next) {
    next({name: name});
  }
  return function middleware (req, res, next) {
    if (req.user) {
      function onResults (profile) {
        req.profile = profile;
        // TODO: fix with urlize
        var base = 'http://' + req.headers.host;
        console.log('ppp', profile, profile.name);
        profile.url = base + ['/users', profile.name ].join('/');
        next( );
      }
      fetchUser(req.user, function done (profile) {
        req.profile = profile;
        var hook = server.events.process('profile', profile, onResults);
        hook.inject(server.events);
      });
    } else { next( ); }
  }
}
