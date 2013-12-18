module.exports = (function ( ) {
  var config = {
      // port for http server to bind to
      // port 6776 if undefined
      port: (process.env.PORT || 6776)
      // type of git backend to use
    , type: (process.env.GIT_BACKEND || 'fs-db')
      // base directory to host bare repos in
    , base: (process.env.BASE || './out')
  };
  return config;
})( );
