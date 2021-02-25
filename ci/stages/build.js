const FigmaController = require('../controllers/figma')
const FileSystemController = require('../controllers/fs')
const TemplatesController = require('../controllers/templates')
const Icon = require('../utils/icon')

module.exports = class BuildStage {

  /**
   * @constructor
   * @param {Object} options 
   * @param {FileSystemController} options.fs
   * @param {FigmaController} options.figma
   * @param {TemplatesController} options.templates
   */
  constructor({ config, fs, figma, templates }){
    this._config = config
    this._figma = figma
    this._fs = fs
    this._templates = templates
  }

  debug(){
    let icon = new Icon({ id: '123', name: 'angle-down-left' })
    icon.output = '/home/alexandremasy/projects/spices/icons/src/icons/angle-down-left.svg'

    this._fs.optimizeIcon(icon)
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
      .then(() => { 
        this._fs.icons = 
        this._templates.icons =
        this._figma.icons
      })
      .then(this._fs.download.bind(this._fs))
      // .then(this._fs.optimize.bind(this._fs))
      .then(this._templates.sprite.bind(this._templates))
      .then(this._templates.scss.bind(this._templates))
      .then(this._templates.vue.bind(this._templates))
      .then(this._templates.demo.bind(this._templates))
      .then(() => resolve())
      .catch(e => {
        console.log(e)
        process.exit(3)
      })
    })
  }
}