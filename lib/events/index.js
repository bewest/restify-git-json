var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , es = require('event-stream')
  , logs = require('../api/logger')
  ;

var gitHooks = require('./hooks');

function make (op, length, next) {
  var result = es.through(write);
  var params = {op: op};
  var pending = length;
  var data;
  function finisher (r) {
    logs.logger.log.debug('PENDING', pending, 'left');
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
    // logs.logger.log.debug('should event emit', chunk, arguments);
    function next ( ) {
      logs.logger.log.debug('NEXT', arguments);
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
      logs.logger.log.debug('LOG', 'data', data);
    });
    // ev.stream.on('end', onEnd);
    function onEnd (data) {
      logs.logger.log.debug("END");
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
      logs.logger.log.debug('no handler');
      process.nextTick(ev.finish);
      // ev.finish( );
      // next( );
    }
    function next ( ) {

      logs.logger.log.debug('process next');
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
    logs.logger.log.debug('process op', op, arguments);
    cb(result);
  });
  function save (chunk, next) {
    logs.logger.log.debug('just recieved', chunk);
    next(null, hook.value(chunk));
  }
  var args = Array.prototype.slice.apply(arguments);
  op = args.shift( );
  logs.logger.log.debug('op', op);
  cb = args.pop( );
  logs.logger.log.debug('args', args);
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
  logs.logger.log.debug('user', name);
  // var hook = this.stream.process('user', function (result) {
  var hook = this.process('user', name, function (result) {
    logs.logger.log.debug('process user', arguments);
    cb(result);
  });
  var map = hook.map(function each (data, n) {
    data.name = data.args.pop( );
    n(null, hook.value(data));
  });

  hook.inject(this);
  return hook;

}

if (!module.parent) {
  logs.logger.log.debug('MAIN');
  var ev = module.exports( );
  ev.on('user', function (hook, next) {
    logs.logger.log.debug('every user request 2', hook.value( ));
    hook.map(function (data, N) {
      logs.logger.log.debug(data);
      data.profile = 'http://logins/' + data.name.toLowerCase( );
      N(null, data);
    });
    return next( );
  });
  /*
  */
  ev.user('bewest', function fetch (value) {
    logs.logger.log.debug('USER returned value', value);
  });
  ev.user('another', function fetch (value) {
    logs.logger.log.debug('USER returned value', value);
  });
}
