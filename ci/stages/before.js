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

  /**
   * Prepare the condition for the process to work
   * - Make sure the output path exists
   * - Remove the existings icons (to compare later on with git)
   */
  run(){
    return new Promise((resolve, reject) => {
      console.log('---Before---');
      this._spinner.start('Preparing the folders')

      this._fs.deleteIconsDirectory()
      .then(this._fs.createOutputDirectory.bind(this._fs))
      .then(() => {
        this._spinner.succeed()
        resolve()
      })
      .catch(e => reject(e))
    })
  }
}