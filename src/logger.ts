import util from 'util'
import WickrIOBotAPI from 'wickrio-bot-api'

const logger = WickrIOBotAPI.logger as {
  info: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
}

function redactSensitiveInfo(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (typeof arg === 'string' && arg.includes('"message"')) {
      return '<redacted>'
    }
    if (typeof arg === 'object' && arg !== null && 'message' in arg) {
      return '<redacted>'
    }
    return arg
  })
}

console.log = function (...args: unknown[]): void {
  const redactedArgs = redactSensitiveInfo(args)
  logger.info(util.format.apply(null, redactedArgs as [string, ...unknown[]]))
}

console.error = function (...args: unknown[]): void {
  const redactedArgs = redactSensitiveInfo(args)
  logger.error(util.format.apply(null, redactedArgs as [string, ...unknown[]]))
}

export = logger
