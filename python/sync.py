#!/usr/bin/python

import serial
import time
import sys

if len(sys.argv) != 4:
	print "Usage: %s <motor code> <run time> <serial port>" % sys.argv[0]
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

ser = serial.Serial(sys.argv[3], 115200, timeout=5)
getResponse()

ser.write(b"WD02200\n")
getResponse()

ser.write(b"WD02000\n")
getResponse()

ser.write(b"WD022%s\n" % sys.argv[1])
getResponse()
for x in range(int(sys.argv[2]) * 2):
	ser.write(b"WD020%s\n" % sys.argv[1])
	getResponse()
	time.sleep(0.5)

ser.write(b"WD02200\n")
getResponse()

ser.close()
