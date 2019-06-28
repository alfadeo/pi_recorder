#!/usr/bin/python3

import RPi.GPIO as GPIO
import subprocess
import sys
from time import sleep
from datetime import datetime
from os import path
import asyncio

# Config
record_path = "/data/record"

# LED states
STATE_STANDBY = 'standby'
STATE_RECORD = 'record'

# Initial state
state = None
p = None

def state_toggle(): 
    global state
    print("state toggle " + str(state))
    newstate = None
    if state is STATE_STANDBY:
        newstate = STATE_RECORD
        record_start()
    if state is STATE_RECORD or state is None:
        newstate = STATE_STANDBY
        record_stop()
    state = newstate

def button_callback(channel):
    print("button callback!")
    state_toggle()

def record_start():
    global p, record_path
    now = datetime.now()
    datestring = now.strftime("%Y-%m-%d_%H-%M-%S")
    filename = datestring + ".wav"
    filepath = path.join(record_path, filename)
    print("start record")
    p = subprocess.Popen(["arecord", filepath])

def record_stop():
    global p
    print("stop record")
    if p:
        p.kill()
    p = None

def setup ():
    # setup event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    GPIO.cleanup()

    # use P1 header pin numbering convention
    GPIO.setmode(GPIO.BOARD)

    # Set up the GPIO channels - one input and one output
    # Use physical pin numbering
    GPIO.setup(23, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

    # Set pin 10 to be an input pin and set initial value to be pulled low (off)
    GPIO.setup(11, GPIO.OUT)

    # Setup event on pin 10 rising edge
    GPIO.add_event_detect(23,GPIO.RISING,callback=button_callback, bouncetime=500)

    # Init state machine
    state_toggle()


    loop.run_until_complete(asyncio.gather(async_runner()))

async def async_runner():
    global state
    on = False
    mode = "on"
    while True:
        if state is STATE_RECORD:
            mode = "flash"
        else:
            mode = "on"

#        print("loop, state: " + str(state) + " - led: " + mode + " - blink: " + str(on))
        if mode is "flash":
            if on:
                GPIO.output(11, GPIO.LOW)
                on = False
            else:
                GPIO.output(11, GPIO.HIGH)
                on = True
        else:
            GPIO.output(11, GPIO.HIGH)

        await asyncio.sleep(0.5)
           

async def debug_runner():
    while True:
        await wait_for_button()

async def wait_for_button():
    GPIO.wait_for_edge(23, GPIO.RISING)
    print("EVENT RISING")

# # Main loop (recursive)
# def run ():
#     # Check for input
#     msg = raw_input("Press q to quit, b for button\n\n") # Run until someone presses enter
#     if msg is 'b':
#         button_callback(0)
#     elif msg is 'q':
#         # Clean um GPIO settings
#         GPIO.cleanup()
#         sys.exit()

#     # Restart the loop
#     run()


setup()
run()
