const ora = require('ora')

const FigmaController = require('../controllers/figma')
const FileSystemController = require('../controllers/fs')

module.exports = class BeforeStep{

  /**
   * @constructor
   * @param {Object} options 
   * @param {FileSystemController} options.fs
   * @param {FigmaController} options.figma
   */
  constructor({ fs, figma }){
    this._spinner = ora();

    this._fs = fs
  }

  run(){
    return new Promise((resolve, reject) => {
      console.log('---Before---');
      this._spinner.start('Preparing the output folders')
      this._fs.createOutputDirectory(this._fs)
      .then(() => {
        this._spinner.succeed()
        resolve()
      })
      .catch(e => reject(e))
    })
  }
}