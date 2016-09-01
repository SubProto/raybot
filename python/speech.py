#!/usr/bin/python

import serial
import time
import sys

if len(sys.argv) != 2:
	print "Usage: %s <serial port>" % sys.argv[0]
	sys.exit()

def getResponse():
    time.sleep(0.25)
    s = ser.readline()
    print "RECV: "
    print s
    if "NMI:" in s:
        print "NMI signal received"
        #sys.exit()    
        s = ser.readline()
        print "RECV: "
        print s
    if "IRQ:" in s:
        print "IRQ signal received"
        s = ser.readline()
        print "RECV: "
        print s

ser = serial.Serial(sys.argv[1], 115200, timeout=5)
getResponse() # initial ready message


for i in range(99):
    ser.write(b"WD000%02X\n" % i)
    getResponse()
    ser.write(b"WD00100\n")
    getResponse()
    ser.write(b"WD001FF\n")
    getResponse()

ser.write(b"WD0003F\n")
getResponse()
ser.write(b"WD00100\n")
getResponse()
ser.write(b"WD001FF\n")
getResponse()

ser.close()
