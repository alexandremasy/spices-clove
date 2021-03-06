const path = require('path')
const config = require('../utils/config')

/**
 * FontType
 * 
 * @class
 */
class FontType {

  /**
   * @constructor
   * @param {Object} options 
   * @param {Font} options.parent The parent font
   * @param {String} options.type The type of font
   */
  constructor({parent, type}){
    if (!FontType.ALL.includes(type) && type !== FontType.SVG){
      console.error(`${type} is not a valid FontType`)
    }

    this.parent = parent
    this.type = type
  }

  ////////////////////////////////////////

  /**
   * @property {String} cdn The public cdn path to the font-face
   * @readonly
   */
  get cdn(){
    return `${config.cdn}@v${this.parent.version}/src/${this.parent.name}/${config.folder_webfont}/${this.parent.name}.${this.type}`
  }

  /**
   * @property {String} system The os path to the font-face
   * @private
   * @readonly
   */
  get system() {
    return path.resolve(config.output, this.parent.name, 'webfonts', `${this.parent.name}.${this.type}`)
  }

  /**
   * @property {String} umd The package path to the font-face
   * @readonly
   */
  get umd(){
    return `${this.parent.name}/iconfont/${this.parent.name}.${this.type}`
  }

  ////////////////////////////////////////

  /**
   * Format the font-face for a JSON representation
   * @returns {Object}
   */
  toJSON(){
    return {
      cdn: this.cdn,
      type: this.type,
      umd: this.umd
    }
  }
}

FontType.SVG = 'svg'
FontType.TTF = 'ttf'
FontType.WOFF = 'woff'
FontType.WOFF2 = 'woff2'
FontType.ALL = [
  FontType.TTF,
  FontType.WOFF,
  FontType.WOFF2,
]

module.exports = FontType