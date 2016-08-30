#!/usr/bin/python

from twisted.internet import reactor
from twisted.internet.serialport import SerialPort
from twisted.protocols.basic import LineReceiver
import sys
import time

interrupt = 0
serConn = 0

if len(sys.argv) != 4:
	print "Usage: %s <motor code> <time to run in seconds> <tty>" % sys.argv[0]
	sys.exit()

class Raybot(LineReceiver):

    delimiter = "\n"
    def connectionMade(self):
        global serConn
        serConn = self
        print 'Connected to Raybot.'

    def sendLine(self, cmd):
        print "Sending: %s" % cmd
        try:
            serConn.transport.write(cmd + "\n")
        except Exception, ex1:
            print "Failed to send"

    def sendCommands(self):
        global interrupt
        print 'Starting command sequence.'
        self.sendLine("WD02000") # clear MET
        time.sleep(0.5)
        self.sendLine("WD02100") # clear motor instruction latches 
        time.sleep(0.5)
        self.sendLine("WD021%s" % sys.argv[1])
        time.sleep(0.5)
        for x in range(int(sys.argv[2]) * 2):
            if interrupt == 0:
                print "Enabling MET for 0.5 seconds..."
                self.sendLine("WD020%s" % sys.argv[1])
                time.sleep(0.5)
        self.sendLine("WD02000") # clear MET
        self.sendLine("WD02100") # clear motor instruction latches 
        reactor.stop()
        
    def lineReceived(self, line):
        global interrupt
        print line
        if "NMI:" in line:
            interrupt = 1

        if "Listening for serial commands" in line:
            print "Starting delayed task..."
            reactor.callLater(1, self.sendCommands)

SerialPort(Raybot(), sys.argv[3], reactor, baudrate=115200)
reactor.run()
