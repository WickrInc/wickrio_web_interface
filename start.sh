#!/bin/bash
if [ -f "/usr/local/nvm/nvm.sh" ]; then
  . /usr/local/nvm/nvm.sh
  nvm use 10.18.1
fi
npm start
