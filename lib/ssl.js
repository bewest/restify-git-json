var fs = require('fs')

function keys (opts) {
  if (opts.key) {
    opts.key = fs.readFileSync(opts.key);
  }
  if (opts.certificate) {
    opts.certificate = fs.readFileSync(opts.certificate);
  }
  return opts;
}
module.exports = keys;

