#!/bin/bash
if [ -f "/usr/local/nvm/nvm.sh" ]; then
  . /usr/local/nvm/nvm.sh
  nvm use 12.20.2
fi
npm start
