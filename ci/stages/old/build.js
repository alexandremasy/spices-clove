const { basil } = require('@spices/basil')
const ora = require('ora')

const Font = require('../models/font')
const FigmaController = require('../controllers/figma')

/**
 * @class
 */
module.exports = class BuildStage {

  /**
   * @constructor
   * @param {Object} options 
   */
  constructor({}){
    this._spinner = ora()
    this._figma = new FigmaController()
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

      basil.sequence(fonts.map(f => this.iterator.bind(this, f)))
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

      this.getIconList(font)
      .then((icons) => {
        console.log(font)
        process.exit();
      })

      // .then(this._fs.download.bind(this._fs))
      // .then(this._fs.optimize.bind(this._fs))
      // .then(this._font.create.bind(this._font))
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

  /**
   * Find out the icons available in Figma and populate the font with it
   * 
   * @param {Font} font 
   * @returns {Promise}
   */
  getIconList(font) {
    return new Promise((resolve, reject) => {
      this._spinner.start('Fetching the list of icons')

      this._figma.getIcons(font.figmaId)
      .then((icons) => {
        this._spinner.succeed(`${icons.length} found`)
        this._spinner.start(`Adding 0/ ${icons.length}`)
        icons.forEach((i, j) => {
          font.addGlyph(i)
          this._spinner.text = `Adding ${j}/ ${icons.length}`
        })

        return resolve()
      })
    })
  }
}