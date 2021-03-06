var serialport  = require('serialport');
var readline    = require('readline');

// get port name from the command line:
portName = process.argv[2];

code = process.argv[3];
duration = process.argv[4];

//console.log('code: '+code+' duration: '+duration);


var timer;

var ackSerial   = 0, 
    interrupt   = 0,
    seqStarted  = 0;

var port = new serialport(portName, {
   baudRate: 115200,
   // look for return and newline at the end of each data packet:
   parser: serialport.parsers.readline("\n")
 });


port.on('open', showPortOpen);
port.on('data', gotSerialData);
port.on('close', showPortClose);
port.on('error', showError);


function showPortOpen() 
{
   console.log('port open. Data rate: ' + port.options.baudRate);
}
 
function gotSerialData(data) 
{
  if(seqStarted) {
    ackSerial = 1;
  }
  console.log('serial data: '+data+'\nackSerial: '+ackSerial);

  if(data.indexOf("NMI:") > -1) {
    console.log('caught interrupt');
    interrupt = 1;
  }
}
 
function showPortClose() 
{
   console.log('port closed.');
}
 
function showError(error) 
{
   console.log('Serial port error: ' + error);
}


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line){
  //console.log(line);
  //port.write(line+'\n'); 
  runArms(code, duration);
})



function runArms(code, duration) 
{
  seqStarted = 1;
  console.log('Starting command sequence.');

  port.write("WD02000\n"); // clear MET

  setTimeout(function() {
    port.write("WD02100\n"); // clear motor instruction latches
    setTimeout(function() {
      port.write("WD021"+code+'\n');
      setTimeout(function() {
        console.log("Enabling MET for "+duration+" seconds...");

        
         
      }, 500);
    }, 500);
  }, 500);
/*
  ackSerialFlag(function() {
    ackSerialFlag(function() {
      ackSerialFlag(function() {

          timer = setTimeout(function() {
            checkInterrupt();
            port.write("WD020"+code+'\n');
            ackSerialFlag(function() {
              
              port.write("WD02000\n"); // clear MET

              ackSerialFlag(function() {
                port.write("WD02100\n"); // clear motor instruction latches
                ackSerialFlag(function() {
                  seqStarted = 0; 
                });
              });
            });
          }, duration);
    
        });
      });
    });
*etTimeout(function2, 3000); 
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
  }
}

