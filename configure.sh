#!/bin/sh

#
# Remove the configure environment variable file
#
rm -f .env.configure

#
# If the input argument exists then check if it is a file
# if so it should contain a list of key=value entries.
#
if [ -n "$1" ]; then
  if [ -f "$1" ]; then
    . "$1"
    cp "$1" .env.configure
  fi
fi

if [ -z "$CLIENT_NAME" ];
then
  node configure.js
else
  WICKRIO_BOT_NAME=$CLIENT_NAME node configure.js
fi

