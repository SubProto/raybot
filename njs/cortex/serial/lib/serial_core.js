
// TODO: use event handlers to manage arrival of serial data

var sys = require('./req');
var req = sys.req;
var ink = sys.ink;

var serialport = req('serialport');

function print(msg) {
  console.log(msg);
}

var seq;

var timer, endLoopTimer;
var delay = 500;

var ackSerial   = 0,
    looping     = 0, // are we in the loop?
    interrupt   = 0,
    seqStarted  = 0,
    serialUp    = 0,  // serial port is open
    serialData  = 0;  // serial data was read from remote system

function liftSerial(device, baudRate, opencb, closecb, datacb, errcb, parser)
{
  var parsecb = function() {
    serialport.parsers.readline("\n");
  };

  if(parser) parsecb = parser;

  var port = new serialport(device, {
     baudRate: baudRate,
     // look for return and newline at the end of each data packet:
     parser: parsecb
   });

  port.on('open', opencb);
  port.on('data', datacb);
  port.on('close', closecb);
  port.on('error', errcb);

  return port;
}

function dropSerial(port)
{
  port.close(function(err){
    //TODO: add custom error messages
  });
}
