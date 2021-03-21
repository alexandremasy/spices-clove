const path = require('path');
const FontFace = require('./fontface')
const semver = require('semver')
const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const exists = util.promisify(fs.exists)
const FSController = require('../controllers/fs')

/**
 * @class
 */
module.exports = class Font{

  /**
   * @constructor
   * @param {Object} options 
   * @param {String} options.figmaId The figma id of the file that contains the icons 
   * @param {String} options.name The font name 
   */
  constructor({ figmaId, name }){
    this.figmaId = figmaId
    this.name = name
    this.glyphs = [];
    this.version = '0.0.0'

    this.ttf = new FontFace({ name, type: FontFace.TTF })
    this.woff = new FontFace({ name, type: FontFace.WOFF })
    this.woff2 = new FontFace({ name, type: FontFace.WOFF2 })

    this.init();
  }

  ////////////////////////////////////////////////////////////////////////////////////////

  /**
   * @property {Array} iconfont The list of icon fonts
   * @readonly
   */
  get iconfonts(){
    return [
      this.ttf,
      this.woff,
      this.woff2
    ]
  }

  /**
   * @property {Number} nGlyph The number of icons available
   */
  get nGlyphs(){
    return this.glyphs.length
  }

  /**
   * @property {String} sprite The path to the svg sprite
   * @readonly
   */
  get sprite(){
    return `${config.s3_url}${this.name}/${this.name}.svg?v=${config.next}`
  }

  ////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Load the font manifest if it exists 
   */
  init(){
    return new Promise((resolve, reject) => {
      let p = path.resolve(config.output, this.name, `manifest.json`)
      
      // Never been generated
      if (!fs.existsSync(p)){
        return Promise.resolve()
      }

      readFile(p)
      .then(data => {
        resolve()
      })
      .catch(e => {
        console.log('[ERR]', e)
        reject(e)
      })
    })
  }

  /**
   * Create the condition to build the font
   * - make sure the output paths exists
   * - remove previous generated files
   */
  before(){
    return new Promise((resolve, reject) => {
      const fsc = new FSController()
      let root = path.resolve(config.output, this.name)
      let icons = path.resolve(root, config.folder_icons)
      let webfont = path.resolve(root, config.folder_webfont)

      fsc.createDirectory(root)
      .then( fsc.deleteDirectory.bind(fsc, icons) )
      .then( fsc.deleteDirectory.bind(fsc, webfont) )
      .then( fsc.createDirectory.bind(fsc, icons) )
      .then( fsc.createDirectory.bind(fsc, webfont) )
      .then( () => resolve() )
      .catch( e => reject(e) )
    })
  }

  /**
   * JSON Object representation of a font
   */
  toJSON(){
    let ret = {
      font: {
        ttf: this.ttf,
        woff: this.woff,
        woff2: this.woff2
      },
      glyphs, 
      name: this.name, 
      version: this.version
    }
  }
}