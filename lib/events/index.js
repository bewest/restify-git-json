var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , es = require('event-stream')
  ;

var gitHooks = require('./hooks');

function make (op, length, next) {
  var result = es.through(write);
  var params = {op: op};
  var pending = length;
  var data;
  function finisher (r) {
    console.log('PENDING', pending, 'left');
    if (--pending < 1) {
      next( );
    }
  }
  var hook = gitHooks('dummy', params, finisher);
  hook.name = op;
  hook.stream = result;
  hook.params = params;
  function value (chunk) {
    if (chunk) {
      data = chunk;
    }
    return data;
  }
  hook.value = value;
  if (gitHooks.isHook(op)) {
    params.arguments = arguments;
    function finish (r) {
      if (r) { return result.end(params.lines); };
      return result.end( );
    }
    // missing params.lines
    hook = gitHooks(op, params, finish);
  }
  function write (chunk) {
    this.emit('data', hook.value(chunk));
  }
  return hook;
}

function Stream (emitters, opts) {

  var s = es.through(writer, end);
  // var s = es.through(write, end);
  function writer (chunk) {
    // console.log('should event emit', chunk, arguments);
    function next ( ) {
      console.log('NEXT', arguments);
    }
    var chain = [ ];
    // chunk.stream.write(chunk.value(chunk.params));
    this.emit('data', chunk);
  }

  function end ( ) {
    // when done
    // this.emit('data', '');
    this.end( );
  }

  function operate (thing, cb) {
    var handlers = emitters.listeners(thing).length;
    var ev = make(thing, handlers, next);
    
    ev.stream.on('data', function (data) {
      console.log('LOG', 'data', data);
    });
    // ev.stream.on('end', onEnd);
    function onEnd (data) {
      console.log("END");
      if (data) {
        ev.value(data);
      }
      cb(ev.value( ));

    }
    ev.onEnd = onEnd;
    function ender ( ) {
      ev.stream.on('end', ev.onEnd);
    }
    ev.ender = ender;
    if (handlers == 0) {
      console.log('no handler');
      process.nextTick(ev.finish);
      // ev.finish( );
      // next( );
    }
    function next ( ) {

      console.log('process next');
      ev.ender( );
      ev.stream.write.apply(ev.stream, ev.value( ));
      ev.stream.end( );

    }
    s.write(ev);
    return ev;

  }

  s.process = operate;

  return s;
}

module.exports = function init (opts) {
  // var emitter = new EventEmitter;
  // var emit = emitter.emit;
  var ev = new Events(opts);
  return ev;
};

function Events (opts) {
  EventEmitter.call(this);
  this.opts = opts;
  this.stream = Stream(this, opts);
}
util.inherits(Events, EventEmitter);
Events.prototype.process = function process (op, cb) {
  
  var hook = this.stream.process(op, function (result) {
    console.log('process op', op, arguments);
    cb(result);
  });
  function save (chunk, next) {
    console.log('just recieved', chunk);
    next(null, hook.value(chunk));
  }
  var args = Array.prototype.slice.apply(arguments);
  op = args.shift( );
  console.log('op', op);
  cb = args.pop( );
  console.log('args', args);
  var body = hook.params;
  body.args = args;
  hook.value(body);
  var $bind = this;
  function emit (stream, bindOnly) {
    if (bindOnly) { $bind = stream; return hook; }
    map(save);
    (stream || $bind).emit(hook.name, hook, hook.finish);
  }
  function map (fn) {
    return (hook.stream = es.pipeline(hook.stream, es.map(fn), es.map(save)));
  }
  hook.map = map;
  hook.inject = emit;

  return hook;
}
Events.prototype.user = function user (name, cb) {
  console.log('user', name);
  // var hook = this.stream.process('user', function (result) {
  var hook = this.process('user', name, function (result) {
    console.log('process user', arguments);
    cb(result);
  });
  var map = hook.map(function each (data, n) {
    data.name = data.args.pop( );
    n(null, hook.value(data));
  });

  hook.inject(this);
  return hook;

}

Events.prototype.middleware = function middleware (opts, server) {
  // var hook = this.process('middle');
  var $ev = this;
  var Hook = this.process;
  function emitter (op) {
  }
  function on (op, fn) {
  }
  function middle (req, res, next) {
    req.events = $ev;
    res.events = $ev;
    next( );
  }
  function use (op, configure, emit) {
    var hook;
    $ev.on(op, function (hook, next) {
      console.log('ON', arguments);
      install.configure(hook, next);
    });
    /*
    */
    function proxy (chain) {
      console.log("PROXY CHAIN", chain);
      install.chain = chain;
    }

    function install (req, res, next) {
      req.fetch = (req.fetch || { });
      var args = [op];
      //  .concat(Array.prototype.slice.apply(arguments));
      // args.push(prime);
      var chain = [ ];
      function fetch (_, fn) {
        var params = args.concat(Array.prototype.slice.apply(arguments));
        fn = params.pop( );
        params.push(finish(fn));
        hook = Hook.apply($ev, params);
        req.fetch[op].hook = hook;
        // inject(req, res, finish);
        // hook.inject($ev, false);
        hook.inject($ev );
      }
      fetch.map = function on (fn) {
        chain.push(fn);
      }
      req.fetch[op] = fetch;
      function inject (req, res, next) {
        if (emit) {
          emit(req, res, next);
        } else { next( ); }
        hook.inject($ev );
      }
      function finish (fn) {
        return function (result) {
          hook.result = result;
          console.log("ATTACHED RESULT", result);
          console.log("hook value", hook.value( ));
          req[op] = result;
          return fn(result);
        }
        
      }
      req.fetch[op] = fetch;
      configure(req, res, prime);

      function prime ( ) {
        args = args.concat(Array.prototype.slice.apply(arguments));
        //  .concat(Array.pr ototype.slice.apply(arguments));
        proxy(chain);
        console.log('prime with args', args, chain);
        /*
        fetch( function fin (result) {
          console.log("FOUND", arguments);
        });
        */
        next( );
        
      }
    }
    function exec (hook, next) {
      // console.log('CONFIG', arguments);
      console.log('CHAIN', install.chain);
      install.chain.forEach(hook.map);
      // install.chain = [ ];
      next( );

    }
    install.configure = exec;
    return install;
  }
  function begin (req, res, next) {
  }
  function after (req, res, next) {
  }
  middle.use = use;
  return middle;
}

if (!module.parent) {
  console.log('MAIN');
  var ev = module.exports( );
  ev.on('user', function (hook, next) {
    console.log('every user request 2', hook.value( ));
    hook.map(function (data, N) {
      console.log(data);
      data.profile = 'http://logins/' + data.name.toLowerCase( );
      N(null, data);
    });
    return next( );
  });
  /*
  */
  ev.user('bewest', function fetch (value) {
    console.log('USER returned value', value);
  });
  ev.user('another', function fetch (value) {
    console.log('USER returned value', value);
  });
}
