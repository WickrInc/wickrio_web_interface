const WickrIOBotAPI = require('wickrio-bot-api');
const util = require('util')


require("dotenv").config({
  path: `.env.configure`
})

var wickrIOConfigure;

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
  try {
    if (err) {
      process.kill(process.pid);
      process.exit();
    }
    if (options.exit) {
      process.exit();
    } else if (options.pid) {
      process.kill(process.pid);
    }
  } catch (err) {
    console.log(err);
  }
}

//catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

//catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {pid: true}));
process.on('SIGUSR2', exitHandler.bind(null, {pid: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true,
  reason: 'uncaughtException'
}));

main();

async function main()
{
    const tokenConfig = [
        {
            token: 'BOT_PORT',
            pattern: '^((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4}))$',
            type: 'number',
            description: "Please enter your client bot's port",
            message: 'Cannot leave empty! Please enter a value',
            required: false,
            default: 'N/A',
        },
        {
            token: 'BOT_API_KEY',
            pattern: '',
            type: 'string',
            description: "Please enter your client bot's API-Key",
            message: 'Cannot leave empty! Please enter a value',
            required: true,
            default: 'N/A',
        },
        {
            token: 'BOT_API_AUTH_TOKEN',
            pattern: '',
            type: 'string',
            description: 'Please create an Web API Basic Authorization Token, we recommend an alphanumeric string with at least 24 characters',
            message: 'Cannot leave empty! Please enter a value',
            required: true,
            default: 'N/A',
        },
        {
            token: 'HTTPS_CHOICE',
            pattern: 'yes|no',
            type: 'string',
            description: 'Do you want to set up an HTTPS connection with the Web API Interface, highly recommended',
            message: 'Please enter either yes or no',
            required: true,
            default: 'no',
            list: [
                {
                    token: 'SSL_KEY_LOCATION',
                    pattern: '',
                    type: 'file',
                    description: 'Please enter the name and location of your SSL .key file',
                    message: 'Cannot find file!',
                    required: true,
                    default: 'N/A',
                },
                {
                    token: 'SSL_CRT_LOCATION',
                    pattern: '',
                    type: 'file',
                    description: 'Please enter the name and location of your SSL .crt file',
                    message: 'Cannot find file!',
                    required: true,
                    default: 'N/A',
                }
            ]
        }
    ];


    var fullName = process.cwd() + "/processes.json";
    wickrIOConfigure = new WickrIOBotAPI.WickrIOConfigure(tokenConfig, fullName, false, false);

    await wickrIOConfigure.configureYourBot("WickrIO-Web-Interface");
    process.exit();
}

