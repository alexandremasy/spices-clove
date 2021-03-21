const path = require('path')
const axios = require('axios')
const fs = require('fs')
const util = require('util')
const { scale } = require('scale-that-svg')
const outlineStroke = require('svg-outline-stroke')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

/**
 * @class
 */
module.exports = class Icon{
  
  /**
   * @constructor
   * @param {Object} options 
   * @param {String} options.id 
   * @param {String} options.name 
   */
  constructor({ category, data = null, figma, id, name, parent, unicode = 0 }){

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
     * @property {String} name The icon name - Comes from the Figma layer name
     */
    this.name = name
  
    /**
     * @property {String} figma The path to the figma file
     */
    this.figma = figma

    /**
     * @property {Number} unicode The unicode value (iconfont)
     */
    this._unicode = unicode
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
   * @property {String} private The OS path to the icon
   * @readonly
   */
  get private(){
    return path.resolve(config.unicodeString, this.parent.name, config.folder_icons, `${this.name}.svg`)
  }

  /**
   * @property {String} unicodeString the string representation of the unicode
   */
  get unicodeString(){
    return this._unicode.codePointAt(0).toString(16)
  }
  
  ////////////////////////////////////////

  /**
   * Download the icon from Figma
   * @returns {Promise}
   * @private
   */
  download(){
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(this.private)
      axios.get(this.figma, {
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
        console.log(this.figma);
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
      this.data ? Promise.resolve(this.data) : readFile(this.private, 'utf-8')
        .then(data => optimize(data, { path: this.private, ...config.svgo }))
        .then(res => {
          icon.data = res.data
          return writeFile(this.private, res.data)
        })
        .then(() => resolve())
        .catch(e => {
          console.log('')
          console.log('optimization failed for', this.name)
          return reject()
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
      this.data ? Promise.resolve(this.data) : readFile(this.private, 'utf-8')
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
        .then(data => writeFile(this.private, data))
        .then(() => resolve())
        .catch(e => {
          console.log('------ Error -------')
          console.log(this.path)
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