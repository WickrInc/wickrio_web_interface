import WickrIOBotAPI from 'wickrio-bot-api'

require('dotenv').config({
  path: `.env.configure`,
})

let wickrIOConfigure: InstanceType<typeof WickrIOBotAPI.WickrIOConfigure>

process.stdin.resume() //so the program will not close instantly

function exitHandler(options: { exit?: boolean; pid?: boolean }, err?: unknown): void {
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
  } catch (e) {
    console.log(e)
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
  } as { exit: boolean; pid?: boolean })
)

main()

async function main(): Promise<void> {
  const tokens = require('../configTokens.json') as {
    supportAdministrators: boolean
    supportVerification: boolean
    integration: string
    tokens: WickrIOBotAPI.WickrIOConfigureTokens[]
  }
  const fullName = process.cwd() + '/processes.json'
  wickrIOConfigure = new WickrIOBotAPI.WickrIOConfigure(
    tokens.tokens,
    fullName,
    tokens.supportAdministrators,
    tokens.supportVerification
  )

  await wickrIOConfigure.configureYourBot(tokens.integration)
  process.exit()
}
