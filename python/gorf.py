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

# Kill Worluk for double score
p1 = ['K', 'I', 'I3', 'L', 'PA0', 'W', 'O', 'O1', 'R', 'L', 'UH', 'K', 'PA0', 'F', 'O1', 'R', 'D', 'UH', 'B', 'UH3', 'L', 'S', 'K', 'O', 'O1', 'R', 'PA1']

# If you get too powerful, I'll take care of you myself.
p2 = ['I', 'F', 'Y1', 'I3', 'IU', 'U', 'G', 'EH', 'EH3', 'T', 'T', 'U', 'U1', 'P', 'AH1', 'W', 'ER', 'F', 'UH1', 'L', 'PA1', 'AH1', 'EH3', 'I3', 'Y', 'L', 'T', 'A', 'K', 'K', 'EH', 'R', 'UH1', 'V', 'Y1', 'IU', 'U', 'PA0', 'M', 'AH1', 'I3', 'Y', 'S', 'EH', 'L', 'F', 'PA1']

# you are in
# the dungeons of wor
p3 = ['Y1', 'IU', 'U', 'UH', 'R', 'I', 'N', 'PA1', 'THV', 'UH', 'PA0', 'D', 'UH', 'N', 'J', 'EH1', 'N', 'Z', 'UH', 'V', 'W', 'O', 'O1', 'R', 'R', 'PA1']


if len(sys.argv) != 2:
	print "Usage: %s <serial port>" % sys.argv[0]
	sys.exit()

def waitForIrq():
    while 1:
        s = ser.readline()
        print "RECV: "
        print s

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

for i in p2:
    ser.write(b"WD000%s\n" % ph[i]) # put phoneme in D000 (D001 strobe is handled by firmware)
    waitForIrq()

for i in p3:
    ser.write(b"WD000%s\n" % ph[i]) # put phoneme in D000 (D001 strobe is handled by firmware)
    waitForIrq()

# end by sending STOP phoneme
ser.write(b"WD0003F\n")
waitForIrq()
ser.write(b"WD0003F\n")
waitForIrq()

ser.close()
