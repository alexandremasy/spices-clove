const ora = require('ora')

module.exports = class BeforeStep{
  constructor({ config, fs, figma }){
    this._spinner = ora();

    this._fs = fs
  }

  run(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Preparing the output folders')
      this._fs.deleteOutputDirectory()
      .then(this._fs.createOutputDirectory.bind(this._fs))
      .then(() => {
        this._spinner.succeed()
        resolve()
      })
      .catch(e => reject(e))
    })
  }
}