const WickrIOBotAPI = require('wickrio-bot-api')
const util = require('util')

require('dotenv').config({
  path: `.env.configure`,
})

var wickrIOConfigure

process.stdin.resume() //so the program will not close instantly

function exitHandler(options, err) {
  try {
    if (err) {
      process.kill(process.pid)
      process.exit()
    }
    if (options.exit) {
      process.exit()
    } else if (options.pid) {
      process.kill(process.pid)
    }
  } catch (err) {
    console.log(err)
  }
}

//catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }))

//catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }))
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }))

//catches uncaught exceptions
process.on(
  'uncaughtException',
  exitHandler.bind(null, {
    exit: true,
    reason: 'uncaughtException',
  })
)

main()

async function main() {
  const tokens = require('./configTokens.json')
  var fullName = process.cwd() + '/processes.json'
  wickrIOConfigure = new WickrIOBotAPI.WickrIOConfigure(
    tokens.tokens,
    fullName,
    tokens.supportAdministrators,
    tokens.supportVerification
  )

  await wickrIOConfigure.configureYourBot(tokens.integration)
  process.exit()
}
