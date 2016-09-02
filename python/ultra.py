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
        sys.stdout.write('RECV: ')
        sys.stdout.write(s)
        sys.exit()    
    if "IRQ:" in s:
        print "IRQ signal received"
        s = ser.readline()
        #sys.stdout.write('RECV: ')
        #sys.stdout.write(s)
    return(s)

ser = serial.Serial(sys.argv[1], 115200, timeout=5)
getResponse() # initial ready message


for i in range(100):
    ser.write(b"WD00C00\n")
    getResponse()
    ser.write(b"RD009\n")
    #sys.stdout.write('D009: ')
    getResponse()

    time.sleep(0.1)

    ser.write(b"RD00A\n")
    #sys.stdout.write('D00A: ')
    lsb = float(getResponse())

    ser.write(b"RD00B\n")
    #sys.stdout.write('D00B: ')
    msb = float(getResponse()) * 256
    print("Distance: %.2f" % ((msb + lsb) / 18.0))

ser.close()
