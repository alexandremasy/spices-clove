module.exports = class BuildStage {
  constructor({ config, fs, figma }){
    this._config = config
    this._figma = figma
    this._fs = fs
  }

  run() {
    return new Promise((resolve, reject) => {
      this._figma.run()
      .then(() => { this._fs.icons = this._figma.icons })
      .then(this._fs.download.bind(this._fs))
      .then(this._fs.sprite.bind(this._fs))
      .then(() => resolve())
      .catch(e => {
        console.log(e)
        process.exit(3)
      })
    })
  }
}