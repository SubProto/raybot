
// TODO: use event handlers to manage arrival of serial data

var sys = require('../lib/req');
var req = sys.req;
var ink = sys.ink;

var serialport = req('serialport');
var program    = req('commander');
var readline   = req('readline');

sys.ready('M O T O R  C O R T E X   I N I T I A L I Z E D');

function print(msg) {
  console.log(msg);
}

program
  .version('0.2.0')
  .usage('<device> ')
  .option('-d, --debug', 'Debug')
  .option('-s, --sim', "Don't send to serial port, only simulate")
  .parse(process.argv);

if(program.args.length !== 3) program.help();

if (program.sim) {
  print(ink.wtag+' SIMULATING'.yellow.bold);
}
if (program.debug) {
  print(ink.wtag+' DEBUGGING'.yellow.bold);
}
// get port name from the command line:
portName  = process.argv[2];
code      = process.argv[3];        // code to write to motors
duration  = process.argv[4] * 1000; // how long to loop the code


var seq;

var timer, endLoopTimer;
var delay = 500;

var ackSerial   = 0,
    looping     = 0, // are we in the loop?
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
  print(ink.brkt('SERIAL READY'.green.bold)+ ' ' +portName+' open @ ' + port.options.baudRate );

  // runSeq(buildSeq(code, duration));
}


function serialOnData(data) {
  if(seqStarted) {
    ackSerial = 1;
  }

  serialData = 1;

  // console.log('serial response: '+data);
  print(ink.brkt('RECV'.magenta.bold)+' '+data);

  // console.log('serial data: '+data+'\nackSerial: '+ackSerial);

  if(data.indexOf("NMI:") > -1) {
    print(ink.wtag+' CAUGHT NMI'.red.bold);
    interrupt = 1;

    // if(looping) { // clear the timer
    //   looping = 0;
    //   clearInterval(timer);
    //   clearInterval(endLoopTimer);
    //   // clean up
    //   getNextInstruction(seq,++seq.current);
    // }
  }
  else if(data.indexOf("Listening for serial commands...") > -1) {
    serialUp = 1;

    runSeq(buildSeq(code, duration));
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
  // begSeq.push('RD012');

  loopSeq.push(met+code);

  // endSeq.push('RD012');
  endSeq.push(clearMet);
  endSeq.push(clearMil);

  seq = {
    instructions: begSeq.concat(loopSeq).concat(endSeq),
    duration: duration,
    current: 0
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

  console.log(ink.brkt('SEQUENCER'.blue.bold)+' EXECUTING...');

  var i = 0;

  getNextInstruction(seq, i);
}

// TODO: git rid of i since now tracking in seq.current
function getNextInstruction(seq, i) {
  if(program.sim) serialData = 1;

  if(i !== 3 && i < seq.instructions.length) {
    console.log(ink.brkt('SEND'.green.bold)+' '+seq.instructions[i]);
    if(!program.sim) port.write(seq.instructions[i]+'\n');

    if(serialData) { // increment i and do next instruction
      seq.current = ++i;
      if(!program.sim) serialData = 0;
      setTimeout(function() {
        getNextInstruction(seq, i);
      }, delay);
    }
    else { // keep running until serialData has arrived
      console.log(ink.wtag+' Waiting for command receipt confirmation');
      setTimeout(function() {
        getNextInstruction(seq, i);
      }, delay);
    }
  } else if(i < seq.instructions.length){
    if(serialData) {
      if(!program.sim) serialData = 0;
      console.log(ink.brkt('SEQUENCER'.blue.bold)+' Looping...');
      looping = 1;
      timer = setInterval(function() { // run the following command every delay s
        if(!program.sim) {
          port.write(seq.instructions[i]+'\n');
          // port.write('RD012\n');
        }
        //console.log('Sending: '+seq.instructions[i]);
        console.log(ink.brkt('SEND'.green.bold)+' '+seq.instructions[i]);
      }, delay);

      endLoopTimer = setTimeout(function() { // interrupt the loop after duration
        if(looping) {
          clearInterval(timer);
          console.log('loop cleared');
          looping = 0;
          getNextInstruction(seq, ++i);
        }
      }, duration);
    }
    else {
      console.log(ink.wtag+' Waiting for command receipt confirmation');
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
