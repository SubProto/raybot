#!/usr/bin/python

import serial
import time
import sys

if len(sys.argv) != 2:
	print "Usage: %s <serial port>" % sys.argv[0]
	sys.exit()

def waitForIrq():
    while 1:
        s = ser.readline()
        #print "RECV: "
        #print s

        if "NMI:" in s:
            print "NMI signal received"
            sys.exit()    
        if "IRQ:" in s:
            print "IRQ signal received"
            return

ser = serial.Serial(sys.argv[1], 115200, timeout=5)
s = ser.readline()

while 1:
    ser.write(b"WD00100\n") # strobe low
    s = ser.readline()
    ser.write(b"WD0003F\n") # put STOP phoneme in D000
    s = ser.readline()
    ser.write(b"WD0013F\n") # strobe high
    waitForIrq()

ser.close()
