#!/bin/sh
if [ -f "/usr/local/nvm/nvm.sh" ]; then
  . /usr/local/nvm/nvm.sh
fi

if [ -f ./node_modules.tgz ]
then
    tar -xvf ./node_modules.tgz
else
    npm install --unsafe-perm
fi
