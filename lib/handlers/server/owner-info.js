
function handler (req, res, next) {
  
  console.log('fetcher', req.fetch.owner);
  var owner = req.fetch.owner(function onOwner (result) {
    // req.owner = result;
    console.log("DONE", 'FETCH',  'RESULT', result);
    res.send(["ha", req.params, result, req.owner]);
    next( );
  })
  // res.send(["ha", req.params, req.fetch]);
}

var endpoint = {
    path: '/repos/:owner/'
  , method: 'get'
  , handler: handler
};
module.exports = function configure (opts, server) {
  var middle;
  var middleware = server.events.middleware(opts, server);
  function onConfig (req, res, next) {
    console.log('onconfig');
    req.fetch.owner.map(function (data, each) {
        console.log('XX data', data);
        data.name = data.args.pop( );
        data.owner = data.name;
        each(null, data);
      });
    next(req.params.owner);
  }
  var fetchUser = middleware.use('owner', onConfig);
  console.log('MIDDLE', middleware);
  function mount (server) {
    server.get(endpoint.path, endpoint.middleware, fetchUser, endpoint.handler);
  }
  endpoint.middleware = [ ];
  endpoint.mount = mount;

  return endpoint;
};
module.exports.endpoint = endpoint;

