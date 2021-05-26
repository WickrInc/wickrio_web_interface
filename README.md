# WickrIO API Web Interface

The official WickrIO Web API tool. Allows to send HTTP requests to communicate with the WickrIO API, and also makes it possible to create Wickr Integrations using any programming language.

To get started with the WickrIO Web API Interface:

First, you would need to setup your system, download and install Docker and run the WickrIO Docker container. Full instructions on how to do so are available here: https://wickrinc.github.io/wickrio-docs/#wickr-io-getting-started

## Configuration:
Run configure.sh after installing the Web API Interface software module, it will propmpt you to configure several properties that are needed to access the URL endpoints. The WickrIO console will walk you through entering the following values:
1. BOT_USERNAME = This is the username of the WickrIO client. If prompted enter that value.
2. BOT_PORT =	The TCP/IP port that the Wickr IO bot will listen on. NOTE: you will have to add the port to the docker run command that starts the Wickr IO Docker container so that port is made available to the Wickr IO integration software.
3. BOT_API_KEY = The API Key that is used in every endpoint call. This is the \<API Key\> value that is contained in every endpoint URL.
4. BOT_API_AUTH_TOKEN = The authentication string used to generate the Base64 value to be sent in the authorization field of the HTTP Header (Recommended: 24-character alphanumeric string). You will need to generate a Base64 value of this token and the add it to the HTTP authorization header (i.e. Basic MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNA==).
5. HTTPS_CHOICE = Choose whether to use an HTTPS server instead of the default HTTP. It is highly recommended that HTTPS be used for security.
6. SSL_KEY_LOCATION = Full path name of the .key file (only required if you are going to use HTTPS). The file must be located in the shared directory that the integration software running on the Docker image can access.
7. SSL_CERT_LOCATION = Full path name of the .cert file (only required if you are going to use HTTPS). The file must be located in the shared directory that the integration software running on the Docker image can access.

For HTTPS and SSL support, you need an OpenSSL certificate file and a key file. Both can be created with the following command:

<div class="center-column"></div>
```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout my.key -out my.cert
```
### Authentication

This version of the Web Interface supports basic authentication. The authentication will use the "Authorization" HTTP header to send the necessary authentication information to the Wickr IO server. If the proper authentication information is not presented to the Wickr IO server then an HTTP 401 response will be sent.

When using basic authentication, a base64 encoded string will be sent to the Wickr IO server.  The following steps should be performed for basic authentication:

1. When the associated Wickr IO bot client is configured and associated with the Web Interface integration, the associated authentication string will be setup. You will use this string to generate the base64 encoded string.
2. Base64 encode the string mentioned above.
3. Supply an "Authorization" header with content "Basic " followed by the encoded string. For example, the string "The big red fox" encodes to "VGhlIGJpZyByZWQgZm94" in base 64, so you would send the string "Basic VGhlIGJpZyByZWQgZm94" in the "Authorization" HTTP header.

<aside class="warning">
The "Authorization" header is encoded - NOT encrypted - thus HTTP basic authentication is only effective over secure connections.  Always use the Web Interface REST API over HTTPS when communicating over insecure networks.
</aside>

## Web Interface REST API

This section describes the REST APIs that are supported by the 2.x version of the Wickr IO Web Interface integration. The following table identifies each of the actions the API supports, the type of HTTP request and the URL used.

API | HTTP | URL
----|------|-----
Send Message | POST | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Messages
Set Message URL Callback | POST | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/MsgRecvCallback?callbackurl=\<url\>
Get Message URL Callback | GET | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/MsgRecvCallback
Delete Message URL Callback | DELETE | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/MsgRecvCallback
Get Received Messages | GET | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Messages?start=\<index\>&count=\<number\>
Get Statistics | GET | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Statistics
Clear Statistics | DELETE | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Statistics
Create Secure Room | POST | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Rooms
Get Room | GET | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Rooms/\<vGroupID\>
Get Rooms | GET | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Rooms
Delete Room | DELETE | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Rooms/\<vGroupID\>
Leave Room | DELETE | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Rooms/\<vGroupID\>&reason=leave
Modify Room | POST | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Rooms/\<vGroupID\>
Create Group Conversation | POST | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/GroupConvo
Get Group Conversations | GET | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/GroupConvo
Get Group Conversation | GET | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/GroupConvo /\<vGroupID\>
Delete Group Conversation | DELETE | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/GroupConvo/\<vGroupID\>
Get Directory | GET | https://\<host\>:\<port\>/WickrIO/V1/Apps/\<API Key\>/Directory

The \<API Key\> value is the value you entered during the configuration of the Wickr Web Interface intagration.

## Usage:
* For full documentation and for information on all of the endpoints and requirements visit: https://wickrinc.github.io/wickrio-docs/#web-interface-rest-api

# License

This software is distributed under the [Apache License, version 2.0](https://www.apache.org/licenses/LICENSE-2.0.html)

```
   Copyright 2021 Wickr, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```
