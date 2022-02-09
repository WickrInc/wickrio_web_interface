const { WickrLogger } = require('wickrio-bot-api')
const util = require('util')

const logger = new WickrLogger().getLogger()

console.log = function () {
  logger.info(util.format.apply(null, arguments))
}
console.error = function () {
  logger.error(util.format.apply(null, arguments))
}

module.exports = logger
