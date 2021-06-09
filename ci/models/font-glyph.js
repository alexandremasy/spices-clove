const path = require('path')
const axios = require('axios')
const { basil } = require('@spices/basil')
const fs = require('fs')
const util = require('util')
const { optimize } = require('svgo');
const config = require('../utils/config')
const execute = require('../utils/execute')
const stream = require('stream')

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
  constructor({ category, data = null, id, name, parent, source, unicode }){

    /**
     * @property {String} category The icon category
     */
    this.category = category

    /**
     * @property {String} data The svg content string
     */
    this.data = data

    /**
     * @property {String} _data A snapshot of the svg content at a given moment.
     */
    this._data = null
    
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
     * @property {Number} unicode The unicode value in number format
     */
    this.unicode = unicode
  }

  ////////////////////////////////////////
  
  /**
   * @property {String} cdn The public cdn path to the icon
   * @readonly
   */
  get cdn(){
    return `${config.cdn}@v${this.parent.version}/src/${this.parent.name}/${config.folder_icons}/${this.name}.svg`
  }

  /**
   * @property {String} umd The package path to the icon
   * @readonly
   */
  get umd(){
    return `${this.parent.name}/${config.folder_icons}/${this.name}.svg`
  }

  /**
   * @property {Boolean} updated Whether or not the glyph has been updated
   */
  get updated(){
    return this._data !== null && this._data !== this.data
  }

  /**
   * @property {String} system The OS path to the icon
   * @readonly
   */
  get system(){
    return path.resolve(this.parent.system, config.folder_icons, `${this.name}.svg`)
  }

  /**
   * @property {String} unicodeString the string representation of the unicode.
   */
  get unicodeString(){
    return this.unicodeChar.codePointAt(0).toString(16)
  }

  /**
   * @property {String} unicodeChar the unicode char for the given unicode.
   */
  get unicodeChar(){
    return String.fromCharCode(this._unicode)
  }

  /**
   * @property {Number} unicode The unicode address of the glyph.
   */
  get unicode(){
    return this._unicode
  }
  set unicode(value){
    // Convert a unicode string to number -> ea02 will be converted to 59906
    if (basil.isString(value) && value.length > 1){
      value = parseInt(value, 16)
    }

    this._unicode = value
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

      axios({
        method: 'GET',
        url: this.source,
        responseType: 'stream'
      })
      .then((res) => {
        return new Promise((re, rr) => {
          res.data.pipe(fs.createWriteStream(this.system))
          res.data.on('end', () => re())
          res.data.on('error', () => rr())
        })
      })
      .then(() => this.refresh())
      .then(() => resolve())
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
      this.data ? Promise.resolve(this.data) : this.refresh()
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
      let command = `yarn outline ${this.toCLI()}`
      execute(command)
      .then(() => this.refresh())
      .then(() => resolve())
      .catch(e => {
        console.log('error', e)
        reject(e)
      })
    })
  }

  /**
   * Refresh the content of the glyph
   *  - Will fetch the system file data
   *  - Update the inner value aka `data`
   *  - Resolve with the new data value
   * 
   * @returns {Promise}
   */
  refresh() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.system, 'utf-8', function(err, data){
        if (err){
          console.log(err)
        }
        this.data = data
        resolve(this.data)
      }.bind(this))
    })
  }

  /**
   * Create a snapshot of the glyph content
   */
  snapshot(){
    return new Promise((resolve,reject) => {
      this.refresh()
        .then((data) => this._data = data)
        .then(() => resolve())
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

  /**
   * Convert the glyph to an cli args format
   * @returns {String}
   */
  toCLI(){
    let ret = [
      `--category=${this.category}`,
      `--cdn=${this.cdn}`,
      `--name=${this.name}`,
      `--src=${this.system}`,
      `--umd=${this.umd}`,
      `--unicode=${this.unicode}`
    ]

    return ret.join(' ')
  }
}