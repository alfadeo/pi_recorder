#!/bin/sh
pip3 install -r requirements.txt
cd webui
npm install
cd app
npm install
npm run build
