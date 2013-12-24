
var builtin = {
    urlize: require('./urlize')
  , getRepo: require ('./get-repo')
  , repo_name: require('./repo-name')
  , getPath: require('./repo-path')
  , fixGitRequest: require('./fix-double-dot-git')
  , uploads: require('./uploads')

//, 
};


function all (opts, server) {
  var all = [ ];
  var mandated = mandatory(opts, server);
  console.log('mandated', mandated);
  all = all.concat(mandated);
  all = all.concat(suggested(opts, server));
  var keys = [ ];
  keys.forEach(function (key) {
    all.push(builtin[key](opts, server));
    
  });
  console.log('all middleware', all);
  return all;
}

function suggested (opts, sever) {
  var middleware = [ builtin.repo_name(opts)
                   , builtin.getPath(opts), builtin.getRepo(opts) ];
  return middleware;
}

function gitMiddle (opts, sever) {
  var gitMiddleWare = [ builtin.repo_name(opts), builtin.fixGitRequest(opts)
                      , builtin.getPath(opts),  builtin.getRepo(opts) ];
  return gitMiddleWare;
}

function mandatory (opts, server) {
  var keys = ['urlize'];
  var wares = [ ];
  keys.forEach(function (key) {
    wares.push(builtin[key](opts, server));
  });
  return wares;
}

module.exports = function configure (opts, server) {
  return all(opts, server);
};
module.exports.builtin = builtin;
module.exports.all = all;
module.exports.mandatory = mandatory;
module.exports.suggested = suggested;
module.exports.gitMiddle = gitMiddle;


