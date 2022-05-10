const util = require('util')

const logger = require('wickrio-bot-api').logger

console.log = function () {
  logger.info(util.format.apply(null, arguments))
}
console.error = function () {
  logger.error(util.format.apply(null, arguments))
}

module.exports = logger
