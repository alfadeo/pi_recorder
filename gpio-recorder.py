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
    print("state toggle (was " + str(state)) + ")"
    newstate = None
    if state is STATE_STANDBY:
        newstate = STATE_RECORD
        record_start()
    if state is STATE_RECORD or state is None:
        newstate = STATE_STANDBY
        record_stop()
    print("state toggle (now " + str(newstate)) + ")"
    state = newstate

def button_callback(channel):
    print("button pressed")
    state_toggle()

def record_start():
    global p, record_path
    now = datetime.now()
    datestring = now.strftime("%Y-%m-%d_%H-%M-%S")
    filename = datestring + ".wav"
    filepath = path.join(record_path, filename)

    command = [
        "arecord",
        "-D", "hw:1,0",
        "-f", "S16_LE",
        "-c", "2",
        "-r", "44100",
        filepath
    ]

    print("start record: " + str(filepath))
    p = subprocess.Popen(command)

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

    # Use physical pin numbering convention (also called P1 or BOARD)
    GPIO.setmode(GPIO.BOARD)

    # Pin 23: IN for button
    GPIO.setup(23, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

    # Pin 11: OUT for LED
    GPIO.setup(11, GPIO.OUT)

    # Pin 23: Detect rising edge and invoke button callback
    GPIO.add_event_detect(23,GPIO.RISING,callback=button_callback, bouncetime=500)

    # Init state machine
    state_toggle()

    # Run async event loop
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

        # print("loop, state: " + str(state) + " - led: " + mode + " - blink: " + str(on))
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

setup()
run()
