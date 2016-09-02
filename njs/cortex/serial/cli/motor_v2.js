
// TODO: use event handlers to manage arrival of serial data

var sys = require('../req');
var req = sys.req;
var ink = sys.ink;

var serialport = req('serialport');
var program    = req('commander');

sys.ready('M O T O R  C O R T E X   I N I T I A L I Z E D');

function print(msg) {
  console.log(msg);
}

program
  .version('0.2.0')
  .usage('<device> <instruction> <duration> [options]')
  .option('-d, --debug', 'Debug')
  .option('-s, --sim', "Don't send to serial port, only simulate")
  .parse(process.argv);

if(program.args.length !== 3) program.help();

if (program.sim) {
  print('SIMULATION ONLY');
}
if (program.debug) {
  print('DEBUGGING');
}
// get port name from the command line:
portName  = process.argv[2];
code      = process.argv[3];        // code to write to motors
duration  = process.argv[4] * 1000; // how long to loop the code


var timer;
var delay = 500;

var ackSerial   = 0,
    interrupt   = 0,
    seqStarted  = 0,
    serialUp    = 0,  // serial port is open
    serialData  = 0;  // serial data was read from remote system

if(!program.sim) {
  var port = new serialport(portName, {
     baudRate: 115200,
     // look for return and newline at the end of each data packet:
     parser: serialport.parsers.readline("\n")
   });

  port.on('open', serialOnOpen);
  port.on('data', serialOnData);
  port.on('close', serialOnClose);
  port.on('error', serialOnErr);
}
else runSeq(buildSeq(code, duration));



// ALL FUNCTION DEFS BELOW

function serialOnOpen() {
  print(ink.itag+' '+portName+' open @: ' + port.options.baudRate + ' '+ink.brkt('OK'.green.bold));

  runSeq(buildSeq(code, duration));
}


function serialOnData(data) {
  if(seqStarted) {
    ackSerial = 1;
  }

  serialData = 1;

  // console.log('serial response: '+data);
  print(data+' '+ink.brkt('OK'.green.bold));

  // console.log('serial data: '+data+'\nackSerial: '+ackSerial);

  if(data.indexOf("NMI:") > -1) {
    print(ink.wtag+' caught interrupt');
    interrupt = 1;
  }
  else if(data.indexOf("Listening for serial commands...") > -1) {
    serialUp = 1;
  }
}


function serialOnClose() {
   print(ink.wtag+' port closed.');
}


function serialOnErr(err) {
   print(ink.etag+' serial port error: ' + err);
}


function buildSeq(code, duration) {
  var begSeq  = []; // beginning sequence
  var loopSeq = []; // sequence to loop for durection
  var endSeq  = []; // ending sequence

  var met = "WD020";
  var mil = "WD021";

  var clearMet = met + "00";
  var clearMil = mil + "00";

  begSeq.push(clearMet);
  begSeq.push(clearMil);
  begSeq.push(mil+code);

  loopSeq.push(met+code);

  endSeq.push(clearMet);
  endSeq.push(clearMil);

  var seq = {
    instructions: begSeq.concat(loopSeq).concat(endSeq),
    duration: duration
  };
  // print(seq);
  return seq;
}


function runSeq(seq) {
  seqStarted = 1;
  console.log('Starting command sequence with code: '+code+' for '+duration+' ms');

  console.log('Sequence Preview:');

  seq.instructions.forEach(function(instruction){
    console.log(instruction);
  });

  console.log('END.');

  console.log('EXECUTING...');

  var i = 0;

  getNextInstruction(seq, i);
}


function getNextInstruction(seq, i) {
  if(program.sim) serialData = 1;

  if(i !== 3 && i < seq.instructions.length) {
    console.log('Sending: '+seq.instructions[i]);
    if(!program.sim) port.write(seq.instructions[i]+'\n');

    if(serialData) { // increment i and do next instruction
      i++;
      if(!program.sim) serialData = 0;
      setTimeout(function() {
        getNextInstruction(seq, i);
      }, delay);
    }
    else { // keep running until serialData has arrived
      console.log('Waiting for command receipt confirmation');
      setTimeout(function() {
        getNextInstruction(seq, i);
      }, delay);
    }
  } else if(i < seq.instructions.length){
    if(serialData) {
      if(!program.sim) serialData = 0;
      console.log('Looping...');
      timer = setInterval(function() { // run the following command every delay s
        if(!program.sim) port.write(seq.instructions[i]+'\n');
        console.log('Sending: '+seq.instructions[i]);
      }, delay);

      setTimeout(function() { // interrupt the loop after duration
        clearInterval(timer);
        console.log('loop cleared');
        getNextInstruction(seq, ++i);
      }, duration);
    }
    else {
      console.log('Waiting for command receipt confirmation');
      setTimeout(function() {
        getNextInstruction(seq, i);
      }, delay);
    }
  }
}


function ackSerialFlag(callback) {
  while(!ackSerial) {
    console.log('.');
    if(ackSerial) break;
  }

  if(ackSerial) {
    console.log('serial acknowledged');
    ackSerial=0;
    callback();
  }
}


function checkInterrupt() {
  if(interrupt) {
    clearInterval(timer);
    interrupt = 0;
    finishSequence();
  }
}
