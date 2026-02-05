const util = require('util')

const logger = require('wickrio-bot-api').logger

function redactSensitiveInfo(args) {
  return args.map(arg => {
    if (typeof arg === 'string' && arg.includes('"message"')) {
      return '<redacted>'
    }
    if (typeof arg === 'object' && arg !== null && arg.message) {
      return '<redacted>'
    }
    return arg
  })
}

console.log = function () {
  const redactedArgs = redactSensitiveInfo(Array.from(arguments))
  logger.info(util.format.apply(null, redactedArgs))
}
console.error = function () {
  const redactedArgs = redactSensitiveInfo(Array.from(arguments))
  logger.error(util.format.apply(null, redactedArgs))
}

module.exports = logger
