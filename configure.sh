#!/bin/sh

#
# If the input argument exists then check if it is a file
# if so it should contain a list of key=value entries.
#
if [ -n "$1" ]; then
  if [ -f "$1" ]; then
    . "$1"
  fi
fi

if [ -z "$CLIENT_NAME" ]; then
  echo "prompt: Please enter your client bot's username:"
  while [ -z "$input" ]
  do
    read  input
    if [ ! -z "$input" ]
    then
       echo 'BOT_USERNAME='${input} >client_bot_info.txt
       WICKRIO_BOT_NAME=${input} node configure.js
    else
      echo "Cannot leave client bot's username empty! Please enter a value:"
    fi
  done
else
   echo 'BOT_USERNAME='$CLIENT_NAME >client_bot_info.txt
   WICKRIO_BOT_NAME=$CLIENT_NAME node configure.js
fi

if [ -z "$LISTEN_PORT" ]; then
  echo "prompt: Please enter your client bot's port:"
  while [ -z "$input2" ]
  do
    read  input2
    if [ ! -z "$input2" ]
    then
      echo 'BOT_PORT='${input2} >>client_bot_info.txt
    else
      echo "Cannot leave client bot's port empty! Please enter a value:"
    fi
  done
else
  echo 'BOT_PORT='${LISTEN_PORT} >>client_bot_info.txt
fi

if [ -z "$API_KEY" ]; then
  echo "prompt: Please enter your client bot's API-Key:"
  while [ -z "$input3" ]
  do
    read  input3
    if [ ! -z "$input3" ]
    then
      echo 'BOT_API_KEY='${input3} >>client_bot_info.txt
    else
      echo "Cannot leave client bot's API-Key empty! Please enter a value:"
    fi
  done
else
  echo 'BOT_API_KEY='${API_KEY} >>client_bot_info.txt
fi

if [ -z "$API_AUTH_TOKEN" ]; then
 echo "prompt: Please create an Web API Basic Authorization Token(we recommend an alphanumeric string with at least 24 characters):"
  while [ -z "$input4" ]
   do
    read  input4
    if [ ! -z "$input4" ]
     then
      echo 'BOT_API_AUTH_TOKEN='${input4} >>client_bot_info.txt
     else
       echo "Cannot leave Basic Authorization Token empty! Please enter a value:"
    fi
  done
else
  echo 'BOT_API_AUTH_TOKEN='${API_AUTH_TOKEN} >>client_bot_info.txt
fi

if [ -z "$HTTPS_CHOICE" ]; then
 echo "prompt: Do you want to set up an HTTPS connection with the Web API Interface(Recommended)(y/n):"
  while [ -z "$input5" ]
   do
    read  input5
    if [ ! -z "$input5" ]
     then
      echo 'HTTPS_CHOICE='${input5} >>client_bot_info.txt
     else
       echo "Cannot leave choice empty! Please enter a value:"
    fi
  done
else
  echo 'HTTPS_CHOICE='${HTTPS_CHOICE} >>client_bot_info.txt
fi

if [ -z "$SSL_KEY_LOCATION" ]; then
if [ "$HTTPS_CHOICE" -o "$input5" = 'y' ]; then
 echo "prompt: Please enter the name and location of your SSL .key file:"
  while [ -z "$input6" ]
   do
    read  input6
    if [ ! -z "$input6" ]
     then
      echo 'SSL_KEY_LOCATION='${input6} >>client_bot_info.txt
     else
       echo "Cannot leave ssl key file location empty! Please enter a value:"
    fi
  done
else
  echo 'SSL_KEY_LOCATION='${SSL_KEY_LOCATION} >>client_bot_info.txt
fi
fi

if [ -z "$SSL_CRT_LOCATION" ]; then
if [ "$HTTPS_CHOICE" -o "$input5" = 'y' ]; then
 echo "prompt: Please enter the name and location of your SSL .crt file:"
  while [ -z "$input7" ]
   do
    read  input7
    if [ ! -z "$input7" ]
     then
      echo 'SSL_KEY_LOCATION='${input7} >>client_bot_info.txt
     else
       echo "Cannot leave ssl certificate file location empty! Please enter a value:"
    fi
  done
else
  echo 'SSL_KEY_LOCATION='${SSL_KEY_LOCATION} >>client_bot_info.txt
fi
fi
