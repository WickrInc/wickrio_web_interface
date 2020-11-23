/*
    This javascript file will be ran in upgrade.sh. It's purpose is
    to change "script": "node broadcast-bot.js" in processes.json to
    "script": "node build/index.js"
*/

// const Proc = require('./processes.json')
const fs = require('fs')

const dataToChange = JSON.parse(fs.readFileSync('./processes.json', 'utf-8'))
dataToChange.apps[0].script = './build/index.js'
dataToChange.apps[0].exec_interpreter = 'node'
if (!dataToChange.apps[0].env.tokens.BROADCAST_ENABLED) {
  dataToChange.apps[0].env.tokens.BROADCAST_ENABLED = {
    value: 'yes',
    encrypted: false,
  }
}
fs.writeFileSync('./processes.json', JSON.stringify(dataToChange, null, 2))
