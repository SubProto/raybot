#!/usr/bin/python

import serial
import time
import sys

ph = {'EH3': '00',
'EH2': '01',
'EH1': '02',
'PA0': '03',
'DT': '04',
'A2': '05',
'A1': '06',
'ZH': '07',
'AH2': '08',
'I3': '09',
'I2': '0A',
'I1': '0B',
'M': '0C',
'N': '0D',
'B': '0E',
'V': '0F',
'CH': '10',
'SH': '11',
'Z': '12',
'AW1': '13',
'NG': '14',
'AH1': '15',
'OO1': '16',
'OO': '17',
'L': '18',
'K': '19',
'J': '1A',
'H': '1B',
'G': '1C',
'F': '1D',
'D': '1E',
'S': '1F',
'A': '20',
'AY': '21',
'Y1': '22',
'UH3': '23',
'AH': '24',
'P': '25',
'O': '26',
'I': '27',
'U': '28',
'Y': '29',
'T': '2A',
'R': '2B',
'E': '2C',
'W': '2D',
'AE': '2E',
'AE1': '2F',
'AW2': '30',
'UH2': '31',
'UH1': '32',
'UH': '33',
'O2': '34',
'O1': '35',
'IU': '36',
'U1': '37',
'THV': '38',
'TH': '39',
'ER': '3A',
'EH': '3B',
'E1': '3C',
'AW': '3D',
'PA1': '3E',
'STOP': '3F'}

p1 = ['I1','I3','N','T','R','IU','U1','U1','D','ER','PA0','UH1','L','ER','R','T', 'PA1', 'PA1']

if len(sys.argv) != 2:
	print "Usage: %s <serial port>" % sys.argv[0]
	sys.exit()

def waitForIrq():
    while 1:
        s = ser.readline()
        if "NMI:" in s:
            print "NMI signal received"
            sys.exit()    
        if "IRQ:" in s:
            print "IRQ signal received"
            return

ser = serial.Serial(sys.argv[1], 115200, timeout=5)
s = ser.readline()
print s

for i in p1:
    ser.write(b"WD000%s\n" % ph[i]) # put phoneme in D000 (D001 strobe is handled by firmware)
    waitForIrq()

# end by sending STOP phoneme
ser.write(b"WD0003F\n")
waitForIrq()
ser.write(b"WD0003F\n")
waitForIrq()

ser.close()
