const FigmaController = require('../controllers/figma')
const FileSystemController = require('../controllers/fs')
const TemplatesController = require('../controllers/templates')
const Icon = require('../utils/icon')
const FontController = require('../controllers/font')

module.exports = class BuildStage {

  /**
   * @constructor
   * @param {Object} options 
   * @param {FileSystemController} options.fs
   * @param {FigmaController} options.figma
   * @param {TemplatesController} options.templates
   */
  constructor({ config, fs, figma, templates }){
    this._figma = figma
    this._fs = fs
    this._templates = templates

    this._font = new FontController()
  }

  /**
   * Build the latest version of the package
   * 
   * - Fetch the icon list from Figma
   * - Download the icons from Figma as svg
   * - Optimize the icons with svgo
   * - Create a svg sprite
   * - Create the scss list of icons
   * - Create the vue sprite component
   */
  run() {
    return new Promise((resolve, reject) => {
      console.log('---Build---');

      
      this._figma.getIcons()
      .then(this._fs.download.bind(this._fs))
      // .then(this._fs.optimize.bind(this._fs))
      .then(this._font.create.bind(this._font))
      .then(this._templates.sprite.bind(this._templates))
      .then(this._templates.scss.bind(this._templates))
      .then(this._templates.list.bind(this._templates))
      .then(() => resolve())
      .catch(e => {
        console.log(e)
        process.exit(2)
      })
    })
  }
}