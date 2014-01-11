var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , es = require('event-stream')
  ;

var gitHooks = require('./hooks');

function DefaultFrame (stream, emitter) {
  var result;
}

function make (op, length, next) {
  var result = es.through( );
  var params = {op: op};
  var pending = length;
  function finisher (r) {
    if (--pending == 0) {
      next( );
    }
  }
  var hook = gitHooks('dummy', params, finisher);
  hook.name = op;
  hook.stream = result;
  hook.params = params;
  if (gitHooks.isHook(op)) {
    params.arguments = arguments;
    function finish (r) {
      if (r) { return result.end(params.lines); };
      return result.end( );
    }
    // missing params.lines
    hook = gitHooks(op, params, finish);
  }
  return hook;

}

function Stream (emitters, opts) {

  var s = es.through(write, end);
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
    hook.name = op;
    hook.stream = result;
    hook.params = params;
    hook.preventDefault = preventDefault;
    function finisher (r) {
      if (!r) {
        cancelled = true;
      }
    };
    var handlers = emitters.listeners(op).length;
    var map = es.map(function (data, next) {
      function value (chunk) {
        if (chunk) {
          data = chunk;
        }
        return data;
      }
      hook.value = value;
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
  function end ( ) {
    // when done
    // this.emit('data', '');
    this.end( );
  }

  function process (thing, cb) {
    // s.write(thing, cb);
    function fetch (data) {
      return {thing:thing, data:data};
    }
    function consume ( ) {
      console.log("CONSUMES", arguments);
      if (cb) {
        return cb.apply(null, arguments);
      }
    }
    // s.once('data', function (res
    s.write(thing, fetch, consume);


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
  var result;
  this.stream.process('user', name, function (hook) {
    result = hook.value( );
    cb(result);
  });
  this.once('user', function (hook, next) {
    console.log('finding user', hook, hook.value( ));
    next( );
  });

}

if (!module.parent) {
  console.log('MAIN');
  var ev = module.exports( );
  ev.on('user', function (hook, next) {
    console.log('every user request', arguments);
    return next( );
  });
  ev.user('bewest', function fetch (hook, next) {
    console.log('modify value here', hook.value( ));
    next( );
  });
}
