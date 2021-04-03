const path = require('path')
const axios = require('axios')
const fs = require('fs')
const util = require('util')
const { scale } = require('scale-that-svg')
const outlineStroke = require('svg-outline-stroke')
const { optimize } = require('svgo');
const config = require('../utils/config')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

/**
 * @class
 */
module.exports = class FontGlyph{
  
  /**
   * @constructor
   * @param {Object} options
   * @param {String} options.category The category of the glyph
   * @param {String} options.data The content of the glyph
   * @param {String} options.id The internal id of the glyph
   * @param {String} options.name The name of the glyph
   * @param {Font} options.parent The Font it is related to
   * @param {String} options.source The path to download the glyph
   * @param {String} options.unicode The unicode address of the glyph in the font
   */
  constructor({ category, data = null, id, name, parent, source, unicode = 0 }){

    /**
     * @property {String} category The icon category
     */
    this.category = category

    /**
     * @property {String} data The svg content string
     */
    this.data = data
    
    /**
     * @property {String} id The icon id - Comes from the Figma API
     */
    this.id = id

    /**
     * @property {Font} parent The parent font
     */
    this.parent = parent

    /**
     * @property {Boolean} pristine Whether or not the glyph has been updated
     */
    this.pristine = true

    /**
     * @property {String} name The icon name - Comes from the Figma layer name
     */
    this.name = name
  
    /**
     * @property {String} source The path to the source file
     */
    this.source = source

    /**
     * @property {Number} unicode The unicode value (iconfont)
     */
    this.unicode = unicode
  }

  ////////////////////////////////////////
  
  /**
   * @property {String} cdn The public cdn path to the icon
   * @readonly
   */
  get cdn(){
    return `${config.s3_url}${this.parent.name}/${config.folder_icons}/${this.name}.svg?v=${config.next}`
  }

  /**
   * @property {String} umd The package path to the icon
   * @readonly
   */
  get umd(){
    return `${this.parent.name}/${config.folder_icons}/${this.name}.svg`
  }

  /**
   * @property {String} system The OS path to the icon
   * @readonly
   */
  get system(){
    return path.resolve(config.output, this.parent.name, config.folder_icons, `${this.name}.svg`)
  }

  /**
   * @property {String} unicodeString the string representation of the unicode
   */
  get unicodeString(){
    return this.unicode.codePointAt(0).toString(16)
  }
  
  ////////////////////////////////////////

  /**
   * Download the icon from Figma
   * @returns {Promise}
   * @private
   */
  download(){
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(this.system)
      axios.get(this.source, {
        responseType: 'stream'
      })
      .then((res) => {
        res.data.pipe(writer)
        return resolve()
      })
      .catch((err) => {
        console.log('---------------')
        console.log('Download failed for:')
        console.log(this.name);
        console.log(this.source);
        console.log(err.message);
        console.log('---------------')
        return reject(e)
      })
    })
  }

  /**
   * Optimize the icon file with svgo
   * @returns {Promise}
   * @private
   */
  optimize(){
    return new Promise((resolve, reject) => {
      this.data ? Promise.resolve(this.data) : readFile(this.system, 'utf-8')
        .then(data => optimize(data, { path: this.system, ...config.svgo }))
        .then(res => {
          this.data = res.data
          return writeFile(this.system, res.data)
        })
        .then(() => resolve())
        .catch(e => {
          console.log('')
          console.log('optimization failed for', this.name)
          return reject(e)
        })
    })
  }

  /**
   * Create the outline version of the icon
   * @returns {Promise}
   * @private
   */
  outline(){
    return new Promise((resolve, reject) => {
      this.data ? Promise.resolve(this.data) : readFile(this.system, 'utf-8')
        .then(data => scale(data, { scale: 100 }))
        .then(data => {
          return outlineStroke(data, {
            optCurve: true,
            step: 4,
            centerHorizontally: true,
            fixedWidth: true,
            color: 'black'
          })
        })
        .then(data => writeFile(this.system, data))
        .then(() => resolve())
        .catch(e => {
          console.log('------ Error -------')
          console.log(this.system)
          console.log('issue with', e)
          return reject()
        })
    })
  }

  /**
   * JSON Object representation of the icon
   * @returns {Object}
   */
  toJSON(){
    return {
      category: this.category,
      cdn: this.cdn,
      name: this.name,
      umd: this.umd,
      unicode: this.unicodeString,
    }
  }
}