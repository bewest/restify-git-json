
module.exports = function configure (opts, server) {

  return function middleware (req, res, next) {
    if (req.user) {
      function onResults (profile) {
        req.profile = profile;
        // TODO: fix with urlize
        var base = 'http://' + req.headers.host;
        req.log.debug('user profile', profile, profile.name);
        profile.url = base + ['/users', req.user ].join('/');
        next( );
      }
      req.log.debug('fetch user', req.user);
      server.fetchUser(req.user, onResults);
    } else { next( ); }
  }
}
