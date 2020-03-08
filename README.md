# pi_recorder

A simple WAV/MP3 recorder on a raspberry pi with hifiberry dac+ adc and a harddrive to record and share data on a local network with only one click

## Installation

```
git clone git@github.com:alfadeo/pi_recorder.git $HOME/pi-recorder
cd $HOME/pi-recorder
./systemd/install.sh
./systemd/start.sh
```

To auto-start at boot make a service file with following content
```
sudo vim /etc/systemd/system/recorder.service
```
```
[Unit]
Description=pi recorder

[Service]
ExecStart=/home/pi/pi-recorder/run.sh

[Install]
WantedBy=multi-user.target
```
and execute
```
sudo systemctl start recorder
sudo systemctl enable recorder
sudo systemctl stop recorder
```
*Note: you can edit the `./systemd/start.sh` file to start only the recorder*


* Start the GPIO-controlled recorder: 
  `./gpio-recorder.py`

* Start the web ui: 
  `node webui/server.js`

## How it works

A Python script uses [RPi.GPIO](https://pypi.org/project/RPi.GPIO/) to listen on a button, start/stop recording (with `arecord`), and let a LED blink. It places recorded WAV files in a folder Recordings.

A NodeJS server uses [Express](https://expressjs.com/en/starter/hello-world.html) to serve the recorded files, a JSON object of all files plus metadata, and the frontend. 

The frontend is a simple Javascript app. It uses [Choo](https://github.com/choojs/choo) to render simple HTML views. The app is bundled with [Browserify](https://github.com/browserify/browserify). To make writing CSS a little nicer, it is loaded with [Sheetify](https://github.com/stackcss/sheetify) and transformed through [sheetify-nested](https://github.com/stackcss/sheetify-nested).
