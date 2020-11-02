const { ConfigBot } = require('wickrio-bot-api')

require('dotenv').config({
  path: `.env.configure`,
})

process.stdin.resume() // so the program will not close instantly

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

// catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }))
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }))

// catches uncaught exceptions
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
  const fullName = process.cwd() + '/processes.json'
  const configWickrIO = new ConfigBot(
    tokens.tokens,
    fullName,
    tokens.supportAdministrators,
    tokens.supportVerification
  )

  await configWickrIO.configureYourBot(tokens.integration)
  process.exit()
}
