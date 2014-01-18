
var exports = module.exports = function (hookName, opts, finish) {
    return new Hook(hookName, opts, finish);
};

var canAbort = exports.canAbort = {
    'applypatch-msg' : true,
    'pre-applypatch' : true,
    'post-applypatch' : false,
    'pre-commit' : true,
    'prepare-commit-msg' : true,
    'commit-msg' : true,
    'post-commit' : false,
    'pre-rebase' : true,
    'post-checkout' : false,
    'post-merge' : false,
    'pre-receive' : true,
    'update' : true,
    'post-receive' : false,
    'post-update' : false,
    'pre-auto-gc' : true,
    'post-rewrite' : false,
    'dummy' : true,
};

exports.names = Object.keys(canAbort);
exports.isHook = function (h) {
  return canAbort[h] === true || canAbort[h] === false;
}

function Hook (name, opts, finish) {
    this.name = name;
    this.finish = finish;
    this.arguments = opts.arguments;
    this.lines = opts.lines;
    this.canAbort = canAbort[name];
}

Hook.prototype.accept = function () {
    if (this.finish) this.finish(true);
};

Hook.prototype.reject = function () {
    if (this.finish) this.finish(false);
};

