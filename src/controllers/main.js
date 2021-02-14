const ConfigController = require('./config')
const FigmaController = require('./figma')
const FileSystemController = require('./fs')

module.exports = class FigmaIconsController{

  /**
   * @constructor
   */
  constructor(){
    this.config = {}

    this._config = new ConfigController();
    this._figma = new FigmaController();
    this._fs = new FileSystemController();
  }

  /**
   * Retrieve the configuration
   * 
   * @returns {Promise}
   */
  getConfig(){
    return new Promise((resolve, reject) => {
      this._config.run()
        .then(() => {
          this._figma.config = this._config.data
          this._fs.config = this._config.data
          
          resolve()
        })
        .catch(e => reject(e))
    })
  }

  /**
   * Generate the list of icons with the Figma API
   * 
   * @returns {Promise}
   */
  getIcons(){
    return new Promise((resolve, reject) => {
      this._figma.run()
      .then(() => {
        this._fs.icons = this._figma.icons
        return resolve()
      })
      .catch(e => reject(e))
    })
  }

  /**
   * Fetch the list of available icons
   */
  fetchIcons(){
    return new Promise((resolve, reject) => {
      this._fs.run()
      .then(() => {
        return resolve()
      })
      .catch(e => reject(e))
    })
  }

  run(){
    this.getConfig()
    .then(this.getIcons.bind(this))
    .then(this.fetchIcons.bind(this))
    .catch(e => console.error(e))
  }

}