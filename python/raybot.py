#!/usr/bin/python

import serial
import time
import sys

if len(sys.argv) != 3:
	print "Usage: %s <motor code> <time to run in seconds>" % sys.argv[0]
	sys.exit()

def getResponse():
    s = ser.readline()
    print s

ser = serial.Serial('/dev/ttyACM0', 115200)
s = ser.readline()
print s

ser.write(b"WD02100\n")
getResponse()

ser.write(b"WD02000\n")
getResponse()

ser.write(b"WD021%s\n" % sys.argv[1])
getResponse()
for x in range(int(sys.argv[2]) * 2):
	ser.write(b"WD020%s\n" % sys.argv[1])
	getResponse()
	time.sleep(0.5)

ser.write(b"WD02100\n")
getResponse()

ser.close()
