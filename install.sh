#!/bin/sh

npm install

if [ -d "/src" ] 
then
    npm run build
fi