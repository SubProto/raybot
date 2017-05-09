
var ink = require('./ink');

function print(msg) {
  console.log(msg);
}

print(ink.itag+' in k  im p o r t e d  '.trap.rainbow);
print(ink.itag+' Imports');
exports.req = req;
exports.ink = ink;
exports.ready = ready;


function req(name) {
  print(ink.tbot+''+ink.brkt(name));
  // print(ink.tbot+' '+name+' '+' ........................  '.grey.bold+ink.brkt('OK'.green.bold));
  return require(name);
}

function ready(msg) {

  if(msg) print(ink.itag+' '+msg.trap.green.bold);

  else print(ink.itag+' S Y S T E M   R E A D Y'.trap.green.bold);
}
