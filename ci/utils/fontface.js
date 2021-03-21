const config = require('./config')

/**
 * FontFace
 * 
 * @class
 */
class FontFace{
  constructor({name, type}){
    if (!FontFace.ALL.includes(type)){
      console.warn(`unknown FontFace: ${type}`)
    }

    this.name = name
    this.type = type
  }

  ////////////////////////////////////////

  /**
   * @property {String} cdn The public cdn path to the font-face
   * @readonly
   */
  get cdn(){
    return `${config.s3_url}${this.name}/${this.name}.${this.type}?v=${config.next}`
  }

  /**
   * @property {String} umd The package path to the font-face
   * @readonly
   */
  get umd(){
    return `${this.name}/iconfont/${this.name}.${this.type}`
  }

  /**
   * @property {String} private The os path to the font-face
   * @private
   * @readonly
   */
  get private(){
    return path.resolve(config.output, this.name, 'iconfont', `${this.name}.${this.type}`)
  }

  ////////////////////////////////////////

  /**
   * Format the font-face for a JSON representation
   * @returns {Object}
   */
  toJSON(){
    return {
      cdn: this.cdn,
      umd: this.umd
    }
  }
}

FontFace.TTF = 'ttf'
FontFace.WOFF = 'woff'
FontFace.WOFF2 = 'woff2'
FontFace.ALL = [
  FontFace.TTF,
  FontFace.WOFF,
  FontFace.WOFF2,
]

module.exports = FontFace