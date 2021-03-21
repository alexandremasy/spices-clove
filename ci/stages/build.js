const { basil } = require('@spices/basil')
const FigmaController = require('../controllers/figma')
const FontController = require('../controllers/font')
const FileSystemController = require('../controllers/fs')
const TemplatesController = require('../controllers/templates')
const Icon = require('../utils/icon')
const Font = require('../utils/font')
const ora = require('ora')

module.exports = class BuildStage {

  /**
   * @constructor
   * @param {Object} options 
   * @param {FontController} options.font
   * @param {FileSystemController} options.fs
   * @param {FigmaController} options.figma
   * @param {TemplatesController} options.templates
   */
  constructor({ font, fs, figma, templates }){
    this._figma = figma
    this._fs = fs
    this._templates = templates
    this._font = font

    this._spinner = ora()
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

      basil.sequence(config.fonts.map(f => this.iterator.bind(this, f)))
      .then(() => {
        console.log('done');
      })
      
    })
  }

  /**
   * Run per font
   * 
   * @param {Font} font 
   * @returns 
   */
  iterator(font){
    return new Promise((resolve, reject) => {
      this._spinner.start('Fetching the list of icons')

      this._figma.getIcons(font.figmaId)
      .then((icons) => {
        console.log(icons)

        process.exit();
      })

      .then(this._fs.download.bind(this._fs))
      // .then(this._fs.optimize.bind(this._fs))
      .then(this._font.create.bind(this._font))
      // .then(this._templates.sprite.bind(this._templates))
      // .then(this._templates.scss.bind(this._templates))
      // .then(this._templates.list.bind(this._templates))
      .then(() => resolve())
      .catch(e => {
        console.log(e)
        process.exit(2)
      })
    })  
  }
}