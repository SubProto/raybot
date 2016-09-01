// colors.js - Console Logging Colors Layer


var colors = require('colors');


// Exports
exports.colors = colors;

// Color Set Theme
colors.setTheme({
    silly: 'rainbow'
  , input: 'grey'
  , verbose: 'cyan'
  , prompt: 'grey'
  , info: 'green'
  , grey: 'grey'
  , help: 'cyan'
  , warn: 'yellow'
  , debug: 'blue'
  , error: 'red'
  , bk: 'grey'
  , path: 'magenta'

  , head:
    'white'
  , sub:
    'yellow'
  , val:
    'magenta'
});

var lbk = '['.bk.bold,
    rbk = ']'.bk.bold,
    tmid   = ' ├─'.bk.bold,
    tbot   = ' └─'.bk.bold;

var ok = 'ok'.info.bold;

exports.ok = ok;

exports.lbk = lbk;
exports.rbk = rbk;
exports.tmid = tmid;
exports.tbot = tbot;

exports.itag  = lbk + '+'.info.bold + rbk;
exports.etag  = lbk + '-'.error.bold + rbk;
exports.wtag  = lbk +'!'.warn.bold + rbk;
exports.dtag  = lbk +'*'.warn.bold + rbk;

exports.brkt = function(msg) {
  return lbk + msg + rbk;
}
