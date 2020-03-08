# pi_recorder

A simple WAV/MP3 recorder on a raspberry pi with hifiberry dac+ adc and a harddrive to record and share data on a local network with only one click

## Installation

```
git clone git@github.com:interym/pi-recorder.git $HOME/pi-recorder
cd $HOME/pi-recorder
./systemd/install.sh
./systemd/start.sh
```

To auto-start at boot:

```
sudo cp /home/pi/pi-recorder/gpio-recorder.py /etc/init.d/
cd /etc/init.d
sudo nano gpio-recorder.py
```
edit file with:
```
# /etc/init.d/gpio-recorder.py
### BEGIN INIT INFO
# Provides:          gpio-recorder.py
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start daemon at boot time
# Description:       Enable service provided by daemon.
### END INIT INFO
*Note: we start the recorder only with this*



* Start the GPIO-controlled recorder: 
  `./gpio-recorder.py`

* Start the web ui: 
  `node webui/server.js`

## How it works

A Python script uses [RPi.GPIO](https://pypi.org/project/RPi.GPIO/) to listen on a button, start/stop recording (with `arecord`), and let a LED blink. It places recorded WAV files in a folder Recordings.

A NodeJS server uses [Express](https://expressjs.com/en/starter/hello-world.html) to serve the recorded files, a JSON object of all files plus metadata, and the frontend. 

The frontend is a simple Javascript app. It uses [Choo](https://github.com/choojs/choo) to render simple HTML views. The app is bundled with [Browserify](https://github.com/browserify/browserify). To make writing CSS a little nicer, it is loaded with [Sheetify](https://github.com/stackcss/sheetify) and transformed through [sheetify-nested](https://github.com/stackcss/sheetify-nested).
