#!/usr/bin/python

import RPi.GPIO as GPIO
import subprocess
import sys
from time import sleep

# Initial state
p = None

def button_callback(channel):
    global p
    if p is None:
        print("start record")
        p = subprocess.Popen(["ls", "-la"])
        set_led("flash")
         
    else:
        print("stop record")
        p.kill()
        set_led("on")
        p = None
 # p.kill()

def set_led (state):
    print "set led state", state
    if state is "on":
        GPIO.output(11, GPIO.HIGH)
    # if state is "flash":
    #     while True:
    #         GPIO.output(11, GPIO.HIGH)
    #         sleep(0.3)
    #         GPIO.output(11, GPIO.LOW)
    #         sleep(0.3)
    #         if        

# GPIO.output(11, GPIO.LOW)
def setup ():
    # use P1 header pin numbering convention
    GPIO.setmode(GPIO.BOARD)

    # Set up the GPIO channels - one input and one output
    # Use physical pin numbering
    GPIO.setup(23, GPIO.IN, pull_up_down=GPIO.PUD_DOWN) 

    # Set pin 10 to be an input pin and set initial value to be pulled low (off)
    GPIO.setup(11, GPIO.OUT)

    # Setup event on pin 10 rising edge
    GPIO.add_event_detect(23,GPIO.BOTH,callback=button_callback)
# Main loop (recursive)
def run ():
    # Check for input
    msg = raw_input("Press q to quit, b for button\n\n") # Run until someone presses enter
    if msg is 'b':
        button_callback(0)
    elif msg is 'q':
        # Clean um GPIO settings
        GPIO.cleanup()
        sys.exit()

    # Restart the loop
    run()

setup()
run()
