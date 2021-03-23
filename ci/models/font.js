const path = require('path');
const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const exists = util.promisify(fs.exists)
const semver = require('semver')

const FileSystemController = require('../controllers/fs')
const FontType = require('./font-type')

/**
 * @class
 */
module.exports = class Font{

  /**
   * @constructor
   * @param {Object} options 
   * @param {String} options.figmaId The figma id of the file that contains the icons 
   * @param {String} options.name The font name 
   * @param {Array<String>} options.types The font types to declare with the font
   */
  constructor({ figmaId, name, types = FontType.ALL }){
    /**
     * @property {String} figmaId The Figma File ID
     */
    this.figmaId = figmaId

    /**
     * @property {String} name The name of the font
     */
    this.name = name
    
    /**
     * @property {Array<FontGlyph>} glyphs The list of glyphs in the font
     */
    this.glyphs = [];
    
    /**
     * @property {Array<FontType>} types The list of font types
     */
    this.types = [];

    /**
     * @property {String} version The currect version of the font. Follows the semver convention
     */
    this.version = '0.0.0'

    types.forEach(t => this.addFontType(t))
  }

  ////////////////////////////////////////////////////////////////////////////////////////

  /**
   * @property {Number} nFontFaces The number of font-faces available
   */
  get nFontFaces(){
    return this.faces.length
  }

  /**
   * @property {Number} nGlyph The number of icons available
   * @readonly
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
   * Add a FontType to the font
   * 
   * @param {String} type
   * @see FontType
   * @returns {Font} 
   */
  addFontType(type){
    if (!FontType.ALL.includes(type)){
      console.error(`${type} is not a valid FontType`)
      return
    }

    this.types.push( new FontType(this, type) )
  }

  /**
   * Add a FontGlyph to the font
   * 
   * @param {Object} options 
   * @param {String} options.category The category of the glyph 
   * @param {String} options.data The content of the glyph
   * @param {String} options.id The internal id of the glyph
   * @param {String} options.name The name of the glyph
   * @param {String} options.source The path to download the glyph
   * @param {String} options.unicode The unicode address of the glyph in the font
   */
  addGlyph({ category, data, figma, id, name, unicode }){
    this.glyphs.push({ category, data, figma, id, name, unicode })
  }

  /**
   * Create the condition to build the font
   * - load & parse the manifest
   * - make sure the output paths exists
   * - remove previous generated files
   * 
   * @returns {Promise}
   */
  reset(){
    return new Promise((resolve, reject) => {
      const fsc = new FileSystemController()
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
   * Load the font manifest if it exists 
   * @returns {Promise}
   */
  load() {
    return new Promise((resolve, reject) => {
      let p = path.resolve(config.output, this.name, `manifest.json`)

      // Never been generated
      if (!fs.existsSync(p)) {
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
   * JSON Object representation of a font
   */
  toJSON(){
    let ret = {
      types: this.types,
      glyphs: this.glyphs, 
      name: this.name, 
      version: this.version
    }
  }
}