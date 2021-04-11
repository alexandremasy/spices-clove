var argv = require('yargs')
  .scriptName("yarn outline")
  .usage('$0 [args]')
  .option('s', {
    alias: 'src',
    type: 'string'
  })
  .version('1.0.0')
  .help()
  .argv

const { src } = argv

const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const { scale } = require('scale-that-svg')
const outlineStroke = require('svg-outline-stroke')

readFile(src, 'utf8')
.then(data => scale(data, { scale: 100 }))
.then(data => {
  return outlineStroke(data, {
    optCurve: true,
    step: 4,
    centerHorizontally: true,
    fixedWidth: true,
    color: 'black'
  })
})
.then(data => writeFile(src, data))
.catch(e => {
  console.error(e);
})
