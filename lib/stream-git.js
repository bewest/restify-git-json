
var platform = require('git-node-platform')
  , jsGit = require('js-git')
  , es = require('event-stream')
  , fsDB = require('git-fs-db')(platform)
  ;

var DB = fsDB
  ;

function logger (msg) {
  return es.through(function (chunk) {
    console.log(msg, chunk);
    this.emit('data', chunk);
  });
}

function Blobs (repo, tree) {
  tree = tree || { };
  var stream = es.pipeline(es.map(function (chunk, cb) {
    var content = chunk.content;
    var name = chunk.name;
    console.log('blob', chunk);
    repo.saveAs("blob", chunk.content, function (err, hash) {
      if (err) { cb(err); throw err; }
      tree[name] = {mode: 0100644, hash: hash, name: name};
      cb(null, tree[name]);
    });
  }));
  return stream;
}

function Tree (blobs, tree) {

  var tree = tree || { };
  var tr = es.through(
    function write (chunk) {
      tree[chunk.name] = chunk; delete chunk.name;
    }
  , function end (chunk) {
     this.emit('data', tree);
     this.end( );
  });

  return tr;
}

function trees (repo, root) {
  root = root || { };
  var stream = es.pipeline(es.map( function (tree, cb) {
    console.log("TREE", tree);
    repo.saveAs('tree', tree, function (err, hash) {
      if (err) { cb(err); }
      var commit = {
        tree: hash
      , author: { name: 'MY AUTHOR', email: 'git@js' }
      , committer: { name: 'MY COMMITTER', email: 'git@js' }
      , message: 'MY JUSTIFICATION'
      };
      if (root.parent) {
        commit.parent = root.parent;
      }
      cb(null, commit);
    });

  }));
  return stream;
}

function Commits (repo, opts) {
  function writer (chunk) {
    // TODO: fill with opts.
    var tr = this;
    console.log('commiting', chunk);
    repo.saveAs('commit', chunk, function (err, hash) {
      console.log('COMMIT', arguments);
      tr.emit('data', {commit: hash, tree: chunk});
    });
  }
  function end ( ) {
    this.end('end');
  }
  return es.through(writer, end);
}

function UpdateBranch(repo, name) {
  function writer (chunk) {
    var tr = this;
    console.log(chunk, chunk.commit);
    var tail = chunk.commit.slice(0, 6);
    var middle = 'incoming'
    var parts = [ middle, name, tail ];
    repo.setHead(parts.join('/'),  function (err) {
      console.log("SET REF", arguments, 'UPDATE TO', chunk.commit);
      repo.updateHead(chunk.commit, function (err) {
        console.log('updated head', arguments);
        tr.emit('data', chunk);
        tr.end( );
      });
    });
  }
  return es.through(writer);
}

function gitStream(name) {
  name = platform.fs(name);
  var repo = jsGit(DB(name));
  console.log("repo", repo);
  var commits = UpdateBranch(repo, 'upload');
  function each (data, cb) {
    console.log('committed tree ', data);
    cb(null, data);
  }
  var stream = es.pipeline(logger('FOO'), Blobs(repo), Tree( ), trees(repo), Commits(repo), commits, es.map(each));
  
  return stream;
}

module.exports = gitStream;
module.exports.gitStream = gitStream;

if (!module.parent) {
  var GIT_REPO = platform.fs('./out/test.git');
  var m = {name: 'incoming.txt', content: 'hello world' }
    , o = {name: 'flurbity.txt', content: 'howdy world' }
    , c = {name: 'incoming-one.txt', content: 'foo\tbar' }
    , k = {name: 'incoming-2013.txt', content: 'qux\tqan' }
    ;
  var incoming = es.readArray([m, o/*, c, k*/]);
  function withResults (err, results) {
    console.log("WITH RESULTS", err, results);
  }
  es.pipeline(incoming, gitStream(GIT_REPO), es.writeArray(withResults));

}
