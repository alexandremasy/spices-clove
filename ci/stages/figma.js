const Listr = require("listr")
const FigmaController = require("../controllers/figma")
const Figma = require('../api/figma')
const config = require('../utils/config')
const Font = require("../models/font")

module.exports = class FontFigma {
  /**
   * Initialize the context for the given font
   *
   * @param {Object} options
   * @param {Object} options.ctx
   * @param {Object} options.task
   * @param {Font} options.font
   */
  static exec({ ctx, font, task }){
    let client = Figma(config.figma_personal_token)

    return new Listr([
      {
        title: 'Fetching the Figma document',
        task: (ctx, task) => FontFigma.fetch(client, ctx, font)
      },
      {
        title: 'Hunting down glyphs in the document',
        task: (ctx, task) => FontFigma.parse(client, ctx, font)
      },
      {
        title: 'Generating the download links',
        task: (ctx, task) => FontFigma.download(client, ctx, font)
      },
      {
        title: 'Registering the icons',
        task: (ctx, task) => FontFigma.register(client, ctx, font)
      },
      {
        title: 'Computing the unicodes',
        task: (ctx, task) => FontFigma.unicodes(client, ctx, font)
      },
      {
        title: 'Generating the manifest',
        task: (ctx, task) => FontFigma.save(client, ctx, font)
      },
    ])
  }

  /**
   * @param {*} client 
   * @param {*} ctx 
   * @param {Font} font 
   * @returns {Promise}
   */
  static fetch(client, ctx, font){
    return FigmaController.fetch(client, ctx, font)
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static parse(client, ctx, font){
    return FigmaController.findIcons(client, ctx, font)
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static download(client, ctx, font){
    return FigmaController.computeImageList(client, ctx, font)
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static register(client, ctx, font){
    return new Promise((resolve, reject) => {
      // Compare the given list with the existing list of icons to compute the difference
      // All the icon who were there(manifest) but are not there anymore(figma) are supposed deleted
      let g = font.glyphs.flatMap(g => g.name)
      let o = ctx.icons.flatMap(o => o.name)
      let d = g.filter(i => !o.includes(i))
      d.forEach(i => font.removeGlyph(i))
  
      // Adding the icons found on the Figma File
      ctx.icons.forEach(i => font.addGlyph(i))
  
      delete ctx.document
      delete ctx.figmaId
      delete ctx.icons

      resolve()
    })
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static unicodes(client, ctx, font){
    font.computeUnicodes()
    return Promise.resolve()
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static save(client, ctx, font){
    return font.save()
  }
}