const fs = require('fs');
const prompt = require('prompt');
const processes = require('./processes.json');
const dataStringify = JSON.stringify(processes);
const dataParsed = JSON.parse(dataStringify);

const {exec, execSync, execFileSync} = require('child_process');
prompt.colors = false;

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

async function main() {
    try {
      var cp = execSync('cp processes.json processes_backup.json');

      if (process.env.WICKRIO_BOT_NAME !== undefined) {
        var newName = "WickrIO-Web-Interface_" + process.env.WICKRIO_BOT_NAME;
      } else {
        var newName = "WickrIO-Web-Interface";
      }

      //var assign = Object.assign(dataParsed.apps[0].name, newName);
      dataParsed.apps[0].name = newName;

      var ps = fs.writeFileSync('./processes.json', JSON.stringify(dataParsed, null, 2));
    } catch (err) {
      console.log(err);
    }
    process.exit();
}
