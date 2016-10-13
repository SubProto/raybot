#!/usr/bin/python

import serial
import time
import sys

if len(sys.argv) != 2:
	print "Usage: %s <serial port>" % sys.argv[0]
	sys.exit()

def getResponse():
    s = ser.readline()
    if "READ:" in s:
       s = s[6:] 
       sys.stdout.write('RECV: ')
       sys.stdout.write(s)
       return(s)
    #sys.stdout.write('RECV: ')
    #sys.stdout.write(s)
    if "NMI:" in s:
        print "NMI signal received"
        s = ser.readline()
        sys.stdout.write('RECV2: ')
        sys.stdout.write(s)
        sys.exit()    
    if "IRQ:" in s:
        print "IRQ signal received"
        s = ser.readline()
        sys.stdout.write('RECV2: ')
        sys.stdout.write(s)
    return(s)

ser = serial.Serial(sys.argv[1], 115200, timeout=5)
getResponse() # initial ready message

sys.stdout.write('starting read loop');

for i in range(0x10,0x20):
    ser.write(b"RD023\n")
    getResponse()
    ser.write(b"RD0%02X\n" % i)
    sys.stdout.write('D0%02X: ' % i)
    getResponse()

ser.close()
