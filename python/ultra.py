#!/usr/bin/python

import serial
import time
import sys

if len(sys.argv) != 2:
	print "Usage: %s <serial port>" % sys.argv[0]
	sys.exit()

def getResponse():
    s = ser.readline()
    print "RECV: "
    print s
    if "NMI:" in s:
        print "NMI signal received"
        sys.exit()    
    if "IRQ:" in s:
        print "IRQ signal received"
        s = ser.readline()
        print "RECV: "
        print s

ser = serial.Serial(sys.argv[1], 115200, timeout=5)
getResponse() # initial ready message


for i in range(100):
    ser.write(b"WD000%02x\n" % i)
    getResponse()

    time.sleep(0.1)

    ser.write(b"RD00A\n")
    time.sleep(0.1)
    getResponse()

    ser.write(b"RD00B\n")
    time.sleep(0.1)
    getResponse()

ser.close()
