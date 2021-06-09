const ora = require('ora')
const { basil } = require('@spices/basil')

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
      
      basil.sequence(fonts.map(f => f.reset.bind(f)))
      .then(() => {
        this._spinner.succeed()
        resolve()
      })
      .catch(e => reject(e))
    })
  }

  iterator(font){
    
  }
}