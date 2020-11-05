#!/bin/sh

#
# Remove the configure environment variable file
#
rm -f .env.configure

#
# If the client_bot_info.txt file exists then convert the values
# from it so that they will be used to configure the values.
# This file is no longer used after this configuration.
#
if [ -f "client_bot_info.txt" ]; then
    . ./client_bot_info.txt
    if [ "$HTTPS_CHOICE" = "n" ]; then
        sed -i "s/HTTPS_CHOICE.*/HTTPS_CHOICE='no'/" client_bot_info.txt
        . ./client_bot_info.txt
    elif [ "$HTTPS_CHOICE" = "y" ]; then
        sed -i "s/HTTPS_CHOICE.*/HTTPS_CHOICE='yes'/" client_bot_info.txt
        . ./client_bot_info.txt
    fi

    mv client_bot_info.txt .env.configure
    CLIENT_NAME=$BOT_USERNAME
#
# If the input argument exists then check if it is a file
# if so it should contain a list of key=value entries.
#
elif [ -n "$1" ]; then
  if [ -f "$1" ]; then
    . "$1"
    cp "$1" .env.configure
  fi
fi

if [ -z "$CLIENT_NAME" ];
then
  node ./build/config/index.js
else
  WICKRIO_BOT_NAME=$CLIENT_NAME node ./build/config/index.js
fi
