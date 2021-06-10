const path = require('path')
const fs = require('fs')
const utils = require('util')

const config = require('../utils/config')
const FontType = require('./font-type')
const FontGlyph = require('./font-glyph')
const { basil } = require('@spices/basil')
const Changelog = require('./changelog')

const readFile = utils.promisify(fs.readFile)
const writeFile = utils.promisify(fs.writeFile)

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
     * @property {Changelog} changes
     */
    this.changes = new Changelog()
    
    /**
     * @property {String} figmaId The Figma File ID
     */
    this.figmaId = figmaId

    /**
     * @property {Array<FontGlyph>} glyphs The list of glyphs in the font
     */
    this.glyphs = [];

    /**
     * @property {Array<String>} _glyphsName The list of all the existing glyphs name
     */
    this._glyphsNames = [];
    
    /**
     * @property {String} name The name of the font
     */
    this.name = name
    
    /**
     * @property {Number} _startUnicode The current highest unicode code.
     * @see https://en.wikipedia.org/wiki/Private_Use_Areas Unicode Private Use Area.
     */
    this._startUnicode = 0xe001;

    /**
     * @property {Array<FontType>} types The list of font types
     */
    this.types = [];

    /**
     * @property {String} version The currect version of the font. Follows the semver convention
     */
    this.version = '0.0.0'

    // Add the types
    types.forEach(t => this.addFontType(t))
  }

  ////////////////////////////////////////////////////////////////////////////////////////

  /**
   * @property {String} manifest
   *  The path to the manifest
   * @readonly
   */
  get manifest(){
    return path.resolve(config.output, this.name, `manifest.json`)
  }

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
   * @property {String} scss The path to the scss manifest
   */
  get scss(){
    return path.resolve(config.output, this.name, `manifest.scss`)
  }

  /**
   * @property {String} sprite The path to the svg sprite
   * @readonly
   */
  get sprite(){
    return `${config.s3_url}${this.name}/${this.name}.svg?v=${config.next}`
  }

  /**
   * @property {FontType} svg
   * @returns {FontType}
   */
  get svg(){
    return this.types.find(t => t.type === FontType.SVG)
  }

  /**
   * @property {String} system The OS path to the font. The root folder.
   * @readonly
   */
  get system() {
    return path.resolve(config.output, this.name)
  }

  /**
   * @returns {FontType}
   * @property {FontType} ttf
   */
  get ttf(){
    return this.types.find(t => t.type === FontType.TTF)
  }
  
  /**
   * @returns {FontType}
   * @property {FontType} woff
   */
  get woff(){
    return this.types.find(t => t.type === FontType.WOFF)
  }

  /**
   * @returns {FontType}
   * @property {FontType} woff2
   */
  get woff2(){
    return this.types.find(t => t.type === FontType.WOFF2)
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
    // Auto add the svg type if one is needed
    if (this.types.length === 0){
      this.types.push( new FontType({parent: this, type: FontType.SVG}) )
    }
    
    this.types.push( new FontType({parent: this, type}) )
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
   */
  addGlyph({ category, data, id, name, source }){
    // find if there is an existing glyph with the same name. Avoid duplicates
    let glyph = this.glyphs.find(g => g.name === name)
    
    // Update the existing icons with the new infos
    if (!basil.isNil(glyph)){
      glyph.category = category || glyph.category
      glyph.data = data || glyph.data
      glyph.id = id || glyph.id
      glyph.source = source || glyph.source
      glyph.pristine = false

      return
    }

    // Add a new Glyph
    glyph = new FontGlyph({
      category,
      data,
      id,
      name,
      parent: this,
      source
    })
    this.glyphs.push(glyph)
    this.changes.add(glyph)
  }

  /**
   * Compute the proper unicode for all the icons
   * 
   * - Find the highest unicode entry
   * - Assign the new unicodes
   */
  computeUnicodes(){
    let codes = this.glyphs.flatMap(g => g.unicode).filter(g => !basil.isNil(g))
    let unicode = Math.max(this._startUnicode, Math.max.apply(null, codes))
    this.glyphs.forEach(g => {
      if (!g.unicode){
        g.unicode = unicode
        unicode++
      }
    })
  }

  /**
   * Load the manifest and parse it
   */
  load(){
    return new Promise((resolve, reject) => {
      // Never been generated
      if (!fs.existsSync(this.manifest)) {
        return resolve()
      }

      readFile(this.manifest, 'utf-8')
        .then(data => {
          data = JSON.parse(data)
          this.parse(data)
          resolve()
        })
        .catch(e => {
          console.log('[ERR]', e)
          reject(e)
        })
    })
  }

  /**
   * Parse the given data and populate the font with it.
   * The existing data will be overwritten.
   * 
   * @param {Object} data The data
   */
  parse(data) {
    this.version = data.version || this.version
    let glyphs = basil.get(data, 'glyphs', [])
    this.glyphs = []
    glyphs.forEach(g => this.glyphs.push(new FontGlyph({
      category: g.category,
      id: g.id,
      name: g.name,
      parent: this,
      source: g.icon,
      unicode: g.unicode 
    })))
  }

  /**
   * Remove the given glyph from the existing glyphs
   * 
   * @param {String} name 
   */
  removeGlyph(name){
    let i = this.glyphs.findIndex(g => g.name === name)
    let glyph = this.glyphs[i]
    this.glyphs.splice(i, 1)

    this.changes.delete(glyph)
  }

  /**
   * Save the font data to the manifest file
   */
  save(){
    return new Promise((resolve, reject) => {
      let data = JSON.stringify(this.toJSON(), null, 2)
      
      Promise.all([
        writeFile(this.manifest, data, 'utf-8'),
        writeFile(this.scss, this.toSCSS(), 'utf-8')
      ])
      .then(() => resolve())
    })
  }

  /**
   * Generate the scss manifest
   * 
   * @returns {String}
   */
  toSCSS(){
    let a = this.glyphs.map(g => {
      return `\$icon-${g.name}: "\\${g.unicodeString}";`
    })
    a = a.join('\n')

    let b = this.glyphs.map(g => {
      return `icon-${g.name}: \$icon-${g.name}`
    })
    b = `\$${this.name}-icons: (\n ${b.join(',\n')});`

    return `${a}\n${b}`
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

    return ret
  }
}