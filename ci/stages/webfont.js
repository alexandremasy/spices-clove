const Listr = require("listr")
const WebfontController = require("../controllers/webfont")
const Font = require("../models/font")
const { basil } = require('@spices/basil')

module.exports = class FontWeb{
  /**
   * Publish the font
   *
   * @param {Object} options
   * @param {Object} options.ctx
   * @param {Object} options.task
   * @param {Font} options.font
   */
  static exec({ ctx, font, task }){
    let ttf = !basil.isNil(font.ttf)
    let woff = !basil.isNil(font.woff)
    let woff2 = !basil.isNil(font.woff2)
    let svg = ttf || woff || woff2

    return new Listr([
      {
        skip: () => svg === false,
        title: 'Creating the svg font',
        task: (ctx, task) => FontWeb.svg(ctx, font, task)
      },
      {
        skip: () => ttf === false,
        title: 'Creating the ttf font',
        task: (ctx, task) => FontWeb.ttf(ctx, font, task)
      },
      {
        skip: () => woff === false,
        title: 'Creating the woff font',
        task: (ctx, task) => FontWeb.woff(ctx, font, task)
      },
      {
        skip: () => woff2 === false,
        title: 'Creating the woff2 font',
        task: (ctx, task) => FontWeb.woff2(ctx, font, task)
      },
    ])
  }
  
  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static svg(ctx, font, task){
    return WebfontController.svg({ font })
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static ttf(ctx, font, task){
    return WebfontController.ttf({ font })
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static woff(ctx, font, task){
    return WebfontController.woff({ font })
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static woff2(ctx, font, task){
    return WebfontController.woff2({ font })
  }
}