
var ink         = require('../ink');
var serialport  = require('serialport');
var readline    = require('readline');


// console.log(cfg.name+' v'+cfg.version);
console.log(ink.itag+' in k  im p o r t e d  '.trap.rainbow);
console.log(ink.itag+' config imported '+' ........................  '.grey.bold+ink.brkt('OK'.green.bold));
console.log(ink.itag+' motor cortex initialized '+' ...............  '.grey.bold+ink.brkt('OK'.green.bold));


// get port name from the command line:
portName  = process.argv[2];
code      = process.argv[3]; // code to write to motors
duration  = process.argv[4] * 1000; // how long to loop the code

//console.log('code: '+code+' duration: '+duration);


var timer;

var delay = 500;

var ackSerial   = 0,
    interrupt   = 0,
    seqStarted  = 0,
    serialUp    = 0,  // serial port is open
    serialData  = 0;  // serial data was read from remote system

var port = new serialport(portName, {
   baudRate: 115200,
   // look for return and newline at the end of each data packet:
   parser: serialport.parsers.readline("\n")
 });


port.on('open', serialOnOpen);
port.on('data', serialOnData);
port.on('close', serialOnClose);
port.on('error', serialOnErr);


function serialOnOpen()
{
   console.log('port open. Data rate: ' + port.options.baudRate);
   runSeq(duration);
}

function serialOnData(data)
{
  if(seqStarted) {
    ackSerial = 1;
  }

  serialData = 1;

  // console.log('serial response: '+data);
  console.log(data+' '+ink.brkt('OK'.green.bold));

  // console.log('serial data: '+data+'\nackSerial: '+ackSerial);

  if(data.indexOf("NMI:") > -1) {
    console.log('caught interrupt');
    interrupt = 1;
  }
  else if(data.indexOf("Listening for serial commands...") > -1) {
    serialUp = 1;

  }
}

function serialOnClose()
{
   console.log('port closed.');
}

function serialOnErr(err)
{
   console.log('Serial port error: ' + err);
}


// var rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
//   terminal: false
// });

// rl.on('line', function(line){
//   //console.log(line);
//   //port.write(line+'\n');
//   runArms(code, duration);
// });


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

var seq = begSeq.concat(loopSeq).concat(endSeq);

// console.log(seq);



function runSeq()
{
  seqStarted = 1;
  console.log('Starting command sequence with code: '+code+' for '+duration+'s');

  console.log('Sequence Preview:');

  seq.forEach(function(instruction){
    console.log(instruction);
  });

  console.log('END.');

  console.log('EXECUTING...');

  var i = 0;

  getNextInstruction(seq, i);

  // port.write(getNextInstruction);

  // setTimeout(function() {
  //   getNextInsruction();
  // }, delay);
}

function getNextInstruction(seq, i)
{
  if(i !== 3 && i < seq.length) {
    console.log('Sending: '+seq[i]);
    port.write(seq[i]+'\n');

    if(serialData) { // increment i and do next instruction
      i++;
      serialData = 0;
      setTimeout(function() {
        getNextInstruction(seq, i);
      }, delay);
    }
    else { // keep running until serialData confirmed
      console.log('Waiting for command receipt confirmation');
      setTimeout(function() {
        getNextInstruction(seq, i);
      }, delay);
    }
  } else if(i < seq.length){
    if(serialData) {
      serialData = 0;
      console.log('Looping...');
      timer = setInterval(function() { // run the following command every delay s
        port.write(seq[i]+'\n');
        console.log('Sending: '+seq[i]);
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

function checkInterrupt()
{
  if(interrupt) {
    clearInterval(timer);
    interrupt = 0;
    finishSequence();
  }
}

function finishSequence() {

          setTimeout(function() {
            port.write("WD02000\n"); // clear MET
              setTimeout(function() {
                port.write("WD02100\n"); // clear motor instruction latches
                setTimeout(function() {
                  seqStarted = 0;
                }, 500);
              }, 501);
          }, 500);
}
