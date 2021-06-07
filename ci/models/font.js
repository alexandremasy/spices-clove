const config = require('../utils/config')
const FontType = require('./font-type')
const FontGlyph = require('./font-glyph')
const { basil } = require('@spices/basil')

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

    // Add the types
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

  /**
   * @property {FontType} svg
   * @returns {FontType}
   */
  get svg(){
    return this.types.find(t => t.type === FontType.SVG)
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
   * @param {String|Number} options.unicode The unicode address of the glyph in the font
   */
  addGlyph({ category, data, id, name, source, unicode }){
    // @TODO Validate the unicode value
    // @TODO Find out the latest valid unicode if unvalid or undefined.

    // find if there is an existing glyph with the same name
    let glyph = this.glyphs.find(g => g.name === name)
    
    // unicode is a number -> convert to a unicode string
    // unicode is a unicode String -> start with ea...
    if (basil.isNumber(unicode) ||
       (basil.isString(unicode) && unicode.length > 1)) {
      unicode = String.fromCharCode(parseInt(unicode, 16))
    }

    if (!basil.isNil(glyph)){
      // console.warn(`Update glyph ${name}`)
      glyph.category = category || glyph.category
      glyph.data = data || glyph.data
      glyph.id = id || glyph.id
      glyph.source = source || glyph.source
      glyph.pristine = false
      // Dont update the unicode of an existing icon

      return
    }

    // console.log(`Add glyph ${name}`)
    this.glyphs.push(new FontGlyph({ 
      category, 
      data, 
      id, 
      name, 
      parent: this,
      source, 
      unicode 
    }))
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
    glyphs.forEach(g => this.addGlyph({
      category: g.category,
      id: g.id,
      name: g.name,
      source: g.icon,
      unicode: g.unicode 
    }))
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