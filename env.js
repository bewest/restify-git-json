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
  if (process.env.SERVER_KEY && process.env.SERVER_CERTIFICATE) {
    config.key = process.env.SERVER_KEY;
    config.certificate = process.env.SERVER_CERTIFICATE;
    var ssl = require('./lib/ssl');
    config = ssl(config);
  }
  return config;
})( );
