var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , es = require('event-stream')
  ;

var gitHooks = require('./hooks');

function DefaultFrame (stream, emitter) {
  var result;
}

function make (op, length, next) {
  var result = es.through(write);
  var params = {op: op};
  var pending = length;
  var data;
  function finisher (r) {
    console.log('PENDING', pending, 'left');
    if (--pending == 0) {
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
  /*
  function write (op, fetch, consume) {
    var params = {op: op};
    var result = es.through( );
    var chain = [ ];
    var hook = gitHooks('dummy', params, finisher);
    // take an incoming operation, like 'user', return a stream performing that
    // operation.
    var cancelled = false;
    function preventDefault ( ) {
      console.log("CANCELED");
      cancelled = true;
      result.end(null);
    }
    hook.preventDefault = preventDefault;
    function finisher (r) {
      if (!r) {
        cancelled = true;
      }
    };
    var handlers = emitters.listeners(op).length;
    var map = es.map(function (data, next) {
      var trigger = function trigger ( ) {
        // --handlers;
        console.log("LEFT", handlers);
        if (--handlers == 0) {
          result.emit('data', data);
          next(null, data);
        }
      }
      emitters.emit(op, hook, trigger);
      if (handlers == 0) {
        next(null, hook.value( ));
      }

    });
      
    chain.push(map);
    if (fetch) {
      var map = es.map(function (data, next) {
        next(null, fetch(data));
      });
      chain.push(map);
    }
    if (consume && fetch) {
      es.pipeline(result, chain, es.writeArray( function (err, body) {
        consume(err, body);
        result.end( );
      }));
    }

    this.emit('data', hook);
  }
  */
  function end ( ) {
    // when done
    // this.emit('data', '');
    this.end( );
  }

  function process (thing, cb) {
    // s.write(thing, cb);
    var handlers = emitters.listeners(thing).length;
    // function make (op, length, next) {
    var ev = make(thing, handlers, next);
    
    ev.stream.on('data', function (data) {
      console.log('LOG', 'data', data);
    });
    ev.stream.on('end', function (data) {
      console.log("END");
      if (data) {
        ev.value(data);
      }
      next( );
    });
    function next ( ) {
      cb(ev.value( ));
    }
    s.write(ev);
    return ev;
    // s.once('data', function (res
    // s.write(thing, fetch, consume);

  }

  s.process = process;

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
  this.stream = Stream(this, opts);
}
util.inherits(Events, EventEmitter);
Events.prototype.user = function user (name, cb) {
  console.log('user', name);
  var hook = this.stream.process('user', function (result) {
    console.log('process user', arguments);
    cb(result);
  });
  var map = es.map(function each (data, n) {
    data.name = data.args.pop( );
    n(null, hook.value(data));
  });
  var chain = [ map ];
  hook.stream = es.pipeline(hook.stream, map);
  var body = hook.params;
  body.args = [name];
  hook.value(body);
  var handlers = this.listeners('user').length;
  var pending = handlers;
  function onEvents ( ) {
    console.log('finished events', pending);
    if (--pending == 0) {
      hook.stream.write.apply(hook.stream, hook.value( ));
      hook.stream.end( );
    }
  }
  this.emit(hook.name, hook, onEvents);

}

if (!module.parent) {
  console.log('MAIN');
  var ev = module.exports( );
  ev.on('user', function (hook, next) {
    console.log('every user request', hook.value( ), next);
    hook.stream = es.pipeline(hook.stream, es.map(function (data, N) {
      console.log(data);
      data.name = data.name.toUpperCase( );
      N(null, data);
    }));
    return next( );
  });
  ev.on('user', function (hook, next) {
    console.log('every user request 2', hook.value( ), next);
    hook.stream = es.pipeline(hook.stream, es.map(function (data, N) {
      console.log(data);
      data.name = data.name.toUpperCase( );
      data.profile = 'http://logins/' + data.name.toLowerCase( );
      N(null, data);
    }));
    return next( );
  });
  ev.user('bewest', function fetch (value) {
    console.log('USER returned value', value);
  });
}
