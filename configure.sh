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

#
# If the client_bot_info.txt file exists then get those values into environment variables
#
if [ -f client_bot_info.txt ]; then
  . ./client_bot_info.txt

  if [ -n "$BOT_USERNAME" ]; then
    if [ -z "$CLIENT_NAME" ]; then
      CLIENT_NAME=$BOT_USERNAME
    fi
  fi
  if [ -n "$BOT_PORT" ]; then
    LISTEN_PORT=$BOT_PORT
  fi
  if [ -n "$BOT_API_KEY" ]; then
    API_KEY=$BOT_API_KEY
  fi
  if [ -n "$BOT_API_AUTH_TOKEN" ]; then
    API_AUTH_TOKEN=$BOT_API_AUTH_TOKEN
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
       BOT_NAME=${input}
    else
      echo "Cannot leave client bot's username empty! Please enter a value:"
    fi
  done
else
   echo 'BOT_USERNAME='$CLIENT_NAME >client_bot_info.txt
   BOT_NAME=$CLIENT_NAME
fi

#==============================================================================
# Process the LISTEN_PORT value, saved as BOT_PORT
#
if [ -z "$LISTEN_PORT" ]; then
  echo "prompt: Please enter your client bot's port:"
else
  echo "prompt: Please enter your client bot's port (default ${LISTEN_PORT}):"
fi

while [ -z "$botportinput" ]
do
  read  botportinput
  if [ ! -z "$botportinput" ]
  then
    echo 'BOT_PORT='${botportinput} >>client_bot_info.txt
  elif [ -n "$LISTEN_PORT" ]; then
    echo 'BOT_PORT='${LISTEN_PORT} >>client_bot_info.txt
    botportinput=$LISTEN_PORT
  else
    echo "Cannot leave client bot's port empty! Please enter a value:"
  fi
done


#==============================================================================
# Process the API_KEY value, saved as BOT_API_KEY
#
if [ -z "$API_KEY" ]; then
  echo "prompt: Please enter your client bot's API-Key:"
else
  echo "prompt: Please enter your client bot's API-Key (default ${API_KEY}):"
fi

while [ -z "$apikeyinput" ]
do
  read  apikeyinput
  if [ ! -z "$apikeyinput" ]
  then
    echo 'BOT_API_KEY='${apikeyinput} >>client_bot_info.txt
  elif [ -n "$API_KEY" ]; then
    echo 'BOT_API_KEY='${API_KEY} >>client_bot_info.txt
    apikeyinput=$API_KEY
  else
    echo "Cannot leave client bot's API-Key empty! Please enter a value:"
  fi
done

#==============================================================================
# Process the API_AUTH_TOKEN value, saved as BOT_API_AUTH_TOKEN
#
if [ -z "$API_AUTH_TOKEN" ]; then
  echo "prompt: Please create an Web API Basic Authorization Token, we recommend an alphanumeric string with at least 24 characters:"
else
  echo "prompt: Please create an Web API Basic Authorization Token, we recommend an alphanumeric string with at least 24 characters (default ${API_AUTH_TOKEN}):"
fi

while [ -z "$authtokeninput" ]
do
  read  authtokeninput
  if [ ! -z "$authtokeninput" ]
  then
    echo 'BOT_API_AUTH_TOKEN='${authtokeninput} >>client_bot_info.txt
  elif [ -n "$API_AUTH_TOKEN" ]; then
    echo 'BOT_API_AUTH_TOKEN='${API_AUTH_TOKEN} >>client_bot_info.txt
    authtokeninput=$API_AUTH_TOKEN
  else
     echo "Cannot leave Basic Authorization Token empty! Please enter a value:"
  fi
done

#==============================================================================
# Process the HTTPS_CHOICE value, saved as HTTPS_CHOICE
#
if [ -z "$HTTPS_CHOICE" ]; then
  echo "prompt: Do you want to set up an HTTPS connection with the Web API Interface, highly recommended [y/n]:"
else
  echo "prompt: Do you want to set up an HTTPS connection with the Web API Interface, highly recommended [y/n] (default ${HTTPS_CHOICE}):"
fi

while [ -z "$httpschoiceinput" ]
do
  read  httpschoiceinput

  if [ ! -z "$httpschoiceinput" ]
  then
    httpschoiceinput=`echo $httpschoiceinput | cut -c1-1` 
    if [ "$httpschoiceinput" = 'y' -o "$httpschoiceinput" = 'n' ]; then
      echo 'HTTPS_CHOICE='${httpschoiceinput} >>client_bot_info.txt
    else
      echo "prompt:Please enter either 'y' or 'n':"
      httpschoiceinput=""
    fi
  elif [ -n "$HTTPS_CHOICE" ]; then
    echo 'HTTPS_CHOICE='${HTTPS_CHOICE} >>client_bot_info.txt
    httpschoiceinput=$HTTPS_CHOICE
  else
    echo "Cannot leave choice empty! Please enter a value:"
  fi
done

#==============================================================================
# Process the SSL_KEY_LOCATION value, saved as SSL_KEY_LOCATION
#
if [ "$HTTPS_CHOICE" -a "$httpschoiceinput" = 'y' ]; then
  if [ -z "$SSL_KEY_LOCATION" ]; then
    echo "prompt: Please enter the name and location of your SSL .key file:"
  else
    echo "prompt: Please enter the name and location of your SSL .key file (default ${SSL_KEY_LOCATION}):"
  fi

  while [ -z "$sslkeylocationinput" ]
  do
    read  sslkeylocationinput
    if [ ! -z "$sslkeylocationinput" ]
    then
      echo 'SSL_KEY_LOCATION='${sslkeylocationinput} >>client_bot_info.txt
    elif [ -n "$SSL_KEY_LOCATION" ]; then
      echo 'SSL_KEY_LOCATION='${SSL_KEY_LOCATION} >>client_bot_info.txt
      sslkeylocationinput=$SSL_KEY_LOCATION
    else
      echo "Cannot leave SSL key file location empty! Please enter a value:"
    fi
  done
else
  echo 'SSL_KEY_LOCATION=' >>client_bot_info.txt
fi


#==============================================================================
# Process the SSL_CRT_LOCATION value, saved as SSL_CRT_LOCATION
#
if [ "$HTTPS_CHOICE" -a "$httpschoiceinput" = 'y' ]; then
  if [ -z "$SSL_CRT_LOCATION" ]; then
    echo "prompt: Please enter the name and location of your SSL .crt file:"
  else
    echo "prompt: Please enter the name and location of your SSL .crt file (default ${SSL_CRT_LOCATION}):"
  fi

  while [ -z "$sslcrtlocationinput" ]
  do
    read  sslcrtlocationinput
    if [ ! -z "$sslcrtlocationinput" ]
    then
      echo 'SSL_CRT_LOCATION='${sslcrtlocationinput} >>client_bot_info.txt
    elif [ -n "$SSL_CRT_LOCATION" ]; then
      echo 'SSL_CRT_LOCATION='${SSL_CRT_LOCATION} >>client_bot_info.txt
      sslcrtlocationinput=$SSL_CRT_LOCATION
    else
      echo "Cannot leave SSL certificate file location empty! Please enter a value:"
    fi
  done
else
  echo 'SSL_CRT_LOCATION=' >>client_bot_info.txt
fi

WICKRIO_BOT_NAME=$BOT_NAME node configure.js
