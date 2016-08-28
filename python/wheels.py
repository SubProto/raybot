#!/usr/bin/python

import serial
import time
import sys

if len(sys.argv) != 3:
	print "Usage: %s <motor code> <time to run in seconds>" % sys.argv[0]
	sys.exit()

def getResponse():
	for x in range(6):
		s = ser.readline()
		#print s
	return

ser = serial.Serial('/dev/ttyACM0', 115200)
s = ser.readline()
print s

ser.write(b"D02200\n")
getResponse()

ser.write(b"D02000\n")
getResponse()

ser.write(b"D022%s\n" % sys.argv[1])
getResponse()
for x in range(int(sys.argv[2]) * 2):
	ser.write(b"D020%s\n" % sys.argv[1])
	getResponse()
	time.sleep(0.5)

ser.write(b"D02200\n")
getResponse()

ser.close()
