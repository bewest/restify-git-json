
var platform = require('git-node-platform')
  , jsGit = require('js-git')
  , es = require('event-stream')
  , fsDB = require('git-fs-db')(platform)
  ;

// TODO: get from config somehow
function db (type) {
  var i = fsDB;
  switch (type) {
    case 'memdb':
      i = require('git-memdb')(platform)
    case 'fs-db':
    default:
      break;
  }
  return i;
}

module.exports = (function (opts) {
  function create (path) {
    path = platform.fs(path);
    var repo = jsGit(db(config( ).type)(path));
    return repo;
  }

  function config (opts) {
     if (opts) create.opts = opts; 
     return create.opts;
  }
  create.opts = opts;
  create.create = create;
  create.config = config;

  return create;
});

