# WickrIO API Web Interface

The official WickrIO Web API tool. Allows to send HTTP requests to communicate with the WickrIO API, and also makes it possible to create Wickr Integrations using any programming language.

To get started with the WickrIO Web API Interface:

## Configuration:
Run configure.sh after installing the Web API Interface software module, it will propmpt you to configure several properties that are needed to access the URL endpoints. The WickrIO console will walk you through entering the following values:
1. BOT_USERNAME = This is the username of the WickrIO client. If prompted enter that value.
2. BOT_PORT = The network port the app is going to be listening on
3. BOT_API_KEY = Custom API Key which will be used in every endpoint call, is the <API Key> from table above.
4. BOT_API_AUTH_TOKEN = Authentication string used to generate the Base64 value to be sent in a request Header (Recommended: 24-character alphanumeric string)
5. HTTPS_CHOICE = Choose whether to use an HTTPS server instead of the default HTTP. It is highly recommended that HTTPS be used for security.
6. SSL_KEY_LOCATION = Full path name of the .key file (only required if y was chosen for HTTPS_CHOICE)
7. SSL_CERT_LOCATION = Full path name of the .cert file (only required if y was chosen for HTTPS_CHOICE)

For HTTPS and SSL support, you need an OpenSSL certificate file and a key file. Both can be created with the following command:
`` openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout my.key -out my.cert ``

## Usage:
* All of the endpoints and requirements are listed in here: https://wickrinc.github.io/wickrio-docs/#web-interface-rest-api
