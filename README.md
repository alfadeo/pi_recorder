# pi_recorder

A simple WAV/MP3 recorder on a raspberry pi with hifiberry dac+ adc and a harddrive to record and share data on a local network with only one click

## Usage

`./install.sh`- install dependencies

`./run.sh` - run the GPIO handler and web ui

## How it works

A Python script uses [RPi.GPIO](https://pypi.org/project/RPi.GPIO/) to listen on a button, start/stop recording (with `arecord`), and let a LED blink.

A NodeJS server uses [Express](https://expressjs.com/en/starter/hello-world.html) to serve the recorded files, a JSON object of all files plus metadata, and the frontend. 

The frontend is a simple Javascript app. It uses [Choo](https://github.com/choojs/choo) to render simple HTML views. The app is bundled with [Browserify](https://github.com/browserify/browserify). To make writing CSS a little nicer, it is loaded with [Sheetify](https://github.com/stackcss/sheetify) and transformed through [sheetify-nested](https://github.com/stackcss/sheetify-nested).
