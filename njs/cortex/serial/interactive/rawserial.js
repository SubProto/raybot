
// fetter

// TODO: read sequence interactively, for real-time testing
//      TODO: save to file feature
// TODO: use event handlers to manage arrival of serial data

var sys = require('../lib/req');
var req = sys.req;
var ink = sys.ink;

var motor_addresses = require('../json/motor_address_map.json');

var serialport = req('serialport');
var program    = req('commander');
var readline   = req('readline');
const fs       = req('fs');
const util     = req('util');


sys.ready('M O T O R  C O R T E X   I N I T I A L I Z E D');

function print(msg) {
  console.log(msg);
}

program
  .version('0.4.0')
  .usage('<device> [-m "right hand open" <time> | <motor numeric code> <time>]')
  .description('Interactive')
  .option('-f, --file <filename>', 'Read sequence from file containing motor commands separated by newline')
  .option('-d, --debug', 'Debug')
  .option('-s, --sim', "Don't send to serial port, only simulate")
  .option('-m, --mnemonic <string>', "Use single string as motor code mnemonic instead of integer codes\n\n"+
           "Motor Address Reference\n\n".yellow.bold+
           "\\/".yellow.bold+" is the numeric code\n"+
           "     \\/".yellow.bold+" is the mnemonic string\n"+
           "01 = right hand open or rho\n"+
           "02 = right hand close or rhc\n".white.bold+
           "03 = right wrist cw or rwcw\n"+
           "04 = right wrist ccw or rwcc\n".white.bold+
           "05 = right elbow open or reo\n"+
           "06 = right elbow close or rec\n".white.bold+
           "07 = right bicep cw or rbcw\n"+
           "08 = right bicep ccw or rbcc\n".white.bold+
           "09 = right shoulder up or rsu\n"+
           "0a = right shoulder down or rsd\n".white.bold+
           "10 = left hand open or lho\n"+
           "20 = left hand close or lhc\n".white.bold+
           "30 = left wrist cw or lwcw\n"+
           "40 = left wrist ccw or lwcc\n".white.bold+
           "50 = left elbow open or leo\n"+
           "60 = left elbow close or lec\n".white.bold+
           "70 = left bicep cw or lbcw\n"+
           "80 = left bicep ccw or lbcc\n".white.bold+
           "90 = left shoulder up or lsu\n"+
           "a0 = left shoulder down or lsd\n".white.bold
         )

  .parse(process.argv);


  // get port name from the command line:
  portName  = process.argv[2];
  code      = process.argv[3];        // code to write to motors
  duration  = process.argv[4] * 1000; // how long to loop the code

  var seq, seq_head, seq_file;

  var timer, endLoopTimer;
  var delay = 250;

  var ackSerial   = 0,
      looping     = 0, // are we in the loop?
      interrupt   = 0,
      seqStarted  = 0,
      serialUp    = 0,  // serial port is open
      serialData  = 0;  // serial data was read from remote system


if (program.args.length < 3 && (program.mnemonic === undefined && program.file === undefined)) program.help();

if (program.file) {
  print(ink.wtag+' READING FROM SEQUENCE FILE: '.yellow.bold + program.file);
  seq_file = fs.readFileSync(program.file, {options: {encoding: 'string'}}).toString().split('\n');
  print(seq_file);
}

if (program.sim) {
  print(ink.wtag+' SIMULATING'.yellow.bold);
}
if (program.debug) {
  print(ink.wtag+' DEBUGGING'.yellow.bold);
}
if (program.mnemonic) {
  print(ink.wtag+' MNEMONIC: '.yellow.bold + program.mnemonic);
}

if (!program.sim) {
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
else { // SIMULATION MODE - only print what we would do
  runSeq(buildSeq(code, duration));
}


// ALL FUNCTION DEFS BELOW

function serialOnOpen() {
  print(ink.brkt('SERIAL READY'.green.bold)+ ' ' +portName+' open @ ' + port.options.baudRate );

  // runSeq(buildSeq(code, duration));
}


function serialOnData(data) {
  if (seqStarted) {
    ackSerial = 1;
  }

  serialData = 1;

  // console.log('serial response: '+data);
  print(ink.brkt('RECV'.magenta.bold)+' '+data);

  // console.log('serial data: '+data+'\nackSerial: '+ackSerial);

  if (data.indexOf("NMI:") > -1) {
    print(ink.wtag+' CAUGHT NMI'.red.bold);
    interrupt = 1;

     if (looping) { // clear the sequencer timers
       looping = 0;
       clearInterval(timer);
       clearInterval(endLoopTimer);
       // clean up
       getNextInstruction(seq,++seq.current);
     }
  }
  else if (data.indexOf("Listening for serial commands...") > -1) {
    serialUp = 1;

    if (program.file) {
      var n = 0, seq_cur, seq_prev;
      seq_file.forEach(function(instruction_s){
        var instruction = instruction_s.split(' ');
        if (instruction[0] && instruction[1]) {
          instruction[1] = instruction[1] * 1000;
          console.log(instruction_s);
          if (!n++) {
            seq_head = seq_prev = buildSeq(instruction[0], instruction[1]);
          } else {
            seq_cur = buildSeq(instruction[0], instruction[1]);
            if (n === 1) seq_head.next = seq_cur;
            seq_prev.next = seq_cur;
            seq_prev = seq_cur;
            seq_cur.next = undefined;
          }
        }
      });
      // print(util.inspect(seq_head, { showHidden: true, depth: null }));
      runSeq(seq_head);
    }
    else {
      runSeq(buildSeq(code, duration, function() {
        // runSeq(buildSeq("05", "01", function() {print(ink.brkt('SEQUENCER'.blue.bold)+' ALL SEQUENCES COMPLETED')}));
      }));
    }
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
  var loopSeq = []; // sequence to loop for duration
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
    current: 0,
    next: undefined
  };
  // print(seq);
  return seq;
}


function runSeq(seq) {
  seqStarted = 1;
  console.log('Starting command sequence with code: '+seq.instructions+' for '+seq.duration+' ms');
  console.log('Sequence Preview:');

  seq.instructions.forEach(function(instruction){
    console.log(instruction);
  });

  console.log('END.');
  console.log(ink.brkt('SEQUENCER'.blue.bold)+' EXECUTING...');

  var i = 0;
  getNextInstruction(seq, i);
}


// TODO: get rid of i since now tracking in seq.current
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
          console.log(ink.brkt('SEQUENCER')+'loop cleared'.red.bold);
          looping = 0;
          getNextInstruction(seq, ++i);
        }
      }, seq.duration);
    }
    else {
      console.log(ink.wtag+' Waiting for command receipt confirmation');
      setTimeout(function() {
        getNextInstruction(seq, i);
      }, delay);
    }
  } else { // sequence is over, do next in chain
    if (seq.next) runSeq(seq.next);
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
