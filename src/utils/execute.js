const process = require('child_process');

function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    let cwd = options && options.cwd ? options.cwd : null;
    let verbose = options && options.verbose ? options.verbose === true : false;
    let logs = '';
    let successCodes = options.successCodes ? options.successCodes : [0]

    const p = process.exec(command, { cwd });
    p.stdout.on('data', (data) => logs += data);
    p.stderr.on('data', (data) => logs += data);
    p.on('exit', (code) => { (successCodes.includes(code) ? resolve({response:logs, code}) : reject({response: logs, code})) })
  })
}

module.exports = executeCommand;
