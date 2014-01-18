
module.exports = function configure (opts, server) {

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
    } else { next( ); }
  }
}
