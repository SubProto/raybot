
#include "Arduino.h"
#include "TimerOne.h"

void irq_isr_falling();
void irq_isr_rising();
void nmi_isr();
void serialEvent();
void prepareForCommand();
void runCommand();
void loadCommand(int addr, int data);
void setAllHigh();
void printPorts();
byte readDataBus(byte hi, byte lo);
void writePhoneme(byte phoneme);

//byte activated[] = {0x2b, 0x21, 0x0e, 0x24, 0x2a, 0x03, 0x2f, 0x19, 0x2a, 0x0b, 0x0f, 0x20, 0x2a, 0x3b, 0x1e, 0x3f};
//byte activated[] = {0x3f, 0x3f};
byte activated[] = {};

// Haven't reconciled the following 3 comments against the updated wiring - trust at your own risk!
// Address bus A0 - A7 A8 - A15
// PC0 - PC7   PL0 - PL7
// Data bus  D0 - D7 = PA0 - PA7


#define MAX_INPUT_LEN 5
#define WRITE_DELAY 10


// Let's define some pins
const byte RE = 4;
const byte RW = 5;
const byte VMA = 6;
const byte PHI2 = 11;

const byte irqPin = 2;  // listen for interrupts on raybot on this pin
const byte rirqPin = 18;  // rising interrupt for ADC
const byte nmiPin = 3;  // listen for interrupts on raybot on this pin
volatile byte irqState = HIGH; // this is the current state of the interrupt
volatile byte rirqState = LOW; // this is the current state of the interrupt
volatile byte nmiState = LOW; // this is the current state of the interrupt
volatile byte lastIrq = HIGH;
volatile byte lastNmi = 0;


char inBuf[MAX_INPUT_LEN] = {'\0'};
int index = 0;


String inputStr = "";             // a string to hold incoming data
boolean serialCmdReady = false;   // whether a serial command is waiting to processs


String direction;		  // command prefixed with W or R (write or read)
String hexStr;                    // keep a hex version of our string
long address, data;               // address and data values as converted from hexStr


void setup()
{
  // Get all the pins in the right state OR IT WONT WORK and many cries.
  // Kudos to fauxtonic for catching this and saving the day!
  pinMode(RW,OUTPUT);
  pinMode(VMA,OUTPUT);
  pinMode(RE,OUTPUT);
  pinMode(PHI2, OUTPUT);

  Timer1.initialize(1); // 1Mhz
  Timer1.pwm(PHI2, 512);

  // set pinMode for ports all at once:
  DDRA = B11111111;
  DDRC = B11111111;
  DDRL = B11111111;

  pinMode(irqPin, INPUT_PULLUP);
  pinMode(rirqPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(irqPin), irq_isr_falling, FALLING);
  attachInterrupt(digitalPinToInterrupt(rirqPin), irq_isr_rising, RISING);

  pinMode(nmiPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(nmiPin), nmi_isr, FALLING);

  inputStr.reserve(256);
  hexStr.reserve(4);

  int i;
  int alen = sizeof(activated);
  for (i=0; i < alen; i++)
  {
    writePhoneme(activated[i]);
    while (irqState == HIGH);
    nmiState = LOW;
    lastNmi = 0;
  }
  // Turn the Serial Protocol ON
  Serial.begin(115200);
  Serial.println("Listening for serial commands...");
}


/*
    Current Operation:
    Wait until a string is detected on serial, then decode and execute.
    /fetter
*/


void loop()
{
  // NOTE: If using serial monitor, make sure dropdown in bottom right is set to newline!!!
  if (serialCmdReady) {
    //Serial.print("Caught serial command: ");
    //Serial.print(inputStr);

    direction = inputStr.substring(0,1); // W or R
    if (direction == "R")
    {
      if(inputStr.length() == 6) {
      	inputStr[5] ='\0';
        hexStr    = inputStr.substring(1,3);
        byte hi   = (byte)strtol(&hexStr[0], NULL, 16);
        hexStr    = inputStr.substring(3,5);
        byte lo   = (byte)strtol(&hexStr[0], NULL, 16);
	      byte out  = readDataBus(hi, lo);
        Serial.print("READ: ");
        Serial.println(out);
      }
      else
      {
        Serial.print("READ SYNTAX ERROR: ");
        Serial.println(inputStr);
      }
    }
    else if (direction == "W")
    {
      if (inputStr.length() == 8) {
        inputStr[7]='\0';
        hexStr  = inputStr.substring(1,5);
        address = strtol(&hexStr[0], NULL, 16);
        hexStr  = inputStr.substring(5,7);
        data    = strtol(&hexStr[0], NULL, 16);

        if (address == 0xd000)
        {
          writePhoneme(byte(data));
          //Serial.print("SENT to D000: ");
          //Serial.println(data, HEX);
        }
        else
        {
          prepareForCommand();        // Ready raybot to load and read a command
          loadCommand(address, data); // load the command
          runCommand();               // run the command
          Serial.print("SENT: ");
          Serial.println(data, HEX);
        }
      }
      else
      {
	      Serial.print("WRITE SYNTAX ERROR: ");
	      Serial.println(inputStr);
      }
    }
    else
    {
	Serial.print("SYNTAX ERROR: ");
	Serial.println(inputStr);
    }
    // clear the string:
    inputStr = "";
    serialCmdReady = false;
  } // end if serialCmdReady

  // check interrupt states
  // if (nmiState == HIGH)
  // {
  //   // lastNmi = readDataBus(0xD0, 0x03);
  //   Serial.print("NMI: ");
  //   Serial.print("Bumper: ");
  //   Serial.println(lastNmi, HEX);
  //   nmiState = LOW;
  //   lastNmi = 0;
  // }
}


// This routine is called when raybot changes the IRQ line: TO LOW
// DO NOT MODIFY if you don't understand arduino interrupts, for ref see:
// https://www.arduino.cc/en/Reference/AttachInterrupt
void irq_isr_falling()
{
  lastIrq  = irqState;
  irqState = LOW;
  Serial.println("IRQ: LOW");
}
void irq_isr_rising() // this is called when IRQ goes HIGH
{
  irqState = HIGH;
  // Serial.println("IRQ: HIGH");
}

// This routine is called when raybot sets NMI (non-maskable interrupt) low
void nmi_isr()
{
  nmiState = HIGH;

  Serial.print("NMI: ");
  Serial.print("Bumper: ");
  Serial.println(lastNmi, HEX);
  nmiState = LOW;

  //NOTE** CANT DO THE NEXT LINE IN ISR MODE-BROKEN (delay wont work, etc)
  //lastNmi = readDataBus(0xD0, 0x03);
  //Serial.print("NMI signal received!");
  //Serial.println(lastNmi);
}

byte readDataBus(byte hi, byte lo)
{
	byte dataRead = 0;
  digitalWrite(RW,LOW); // write mode
  digitalWrite(VMA,LOW); // prepare for high transition needed by 74LS374
	DDRA = B00000000; // set port pins to input
	PORTC = lo;
	PORTL = hi; // address decoder output should be low now

  // reads on the ADC require waiting for an interrupt before proceeding
  if ((hi == 0xd0) && ((lo > 0x0f) && (lo < 0x20)))
  {
    digitalWrite(VMA,HIGH);
    delay(10);
    digitalWrite(VMA,LOW);
    while (irqState == LOW) {};
    //rirqState = LOW;
  }

  digitalWrite(RW,HIGH); // bring RW high to make NAND output low to 74LS374 enable pin
  digitalWrite(VMA,HIGH); // now transition to high on 74LS374 clock in
	dataRead = PINA;  // read the data bus contents
	DDRA = B11111111; // set port pins to output
  digitalWrite(RW,LOW); // RW returns to LOW, NAND goes high, pin 1 on 74LS374 is now disabled (high impedance)
	return dataRead;
}

// serialEvent() gets called implicitly every loop
// see: https://www.arduino.cc/en/Tutorial/SerialEvent
void serialEvent() {
  if (Serial)
  {
    while (Serial.available()) {
      // get the new byte:
      char inChar = (char)Serial.read();
      // add it to the inputString:
      inputStr += inChar;
      // if the incoming character is a newline, set a flag
      // so the main loop can do something about it:
      if (inChar == '\n') {
        serialCmdReady = true;
      }
    }
  }
  else
  {
    Serial.begin(115200);
    Serial.println("Listening for serial commands...");
  }
}


// Get raybot's system ready to handle a command.
// This basically sets some pins into the states that
// get raybot ready to read the address and data bus.
void prepareForCommand()
{
  digitalWrite(RE,HIGH);
  delay(WRITE_DELAY);
  digitalWrite(VMA,LOW);
  delay(WRITE_DELAY);
  digitalWrite(RW,HIGH);
  delay(WRITE_DELAY);
}




// Tell raybot's system to commit the command.
// Set some pins to tell raybot's circuits to consume the address and bus data.
void runCommand()
{
  delay(WRITE_DELAY);
  digitalWrite(VMA,HIGH);
  delay(WRITE_DELAY);
  digitalWrite(RW,LOW);
  //Serial.write("sleeping 1s\n");
  delay(WRITE_DELAY);
}


void loadCommand (int addr, int data)
{
  PORTA = data;
  PORTC = addr & 0xFF;
  PORTL = addr >> 8;
  //printPorts();
}


void setAllHigh()
{
  PORTA = 0x00;
  PORTC = 0x00;
  PORTL = 0xFF;
  //printPorts();
}


void printPorts()
{
  Serial.println("Ports loaded with: ");
  Serial.print("portA: ");
  Serial.println(PORTA,HEX);

  Serial.print("portC: ");
  Serial.println(PORTC, HEX);

  Serial.print("portL: ");
  Serial.println(PORTL, HEX);
}


void writePhoneme(byte phoneme)
{
    // special handling for Votrax SC-01 chip
    digitalWrite(RW,LOW); // write mode
    PORTA=phoneme; // Load phoneme code into 0xd000
    PORTC=0;
    PORTL=0xd0; // latch data
    PORTL=0; // ready for next latch

    PORTA=1; // Strobe high - bit 1 of 0xd001
    PORTC=1;
    PORTL=0xd0;
    PORTL=0;

    PORTA=0; // Strobe low
    PORTC=1;
    PORTL=0xd0;
    PORTL=0;
}
