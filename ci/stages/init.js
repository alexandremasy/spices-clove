const Listr = require("listr")
const FileSystemController = require("../controllers/fs")
const Font = require("../models/font")
const config = require('../utils/config')
const path = require('path')

module.exports = class FontInit {
  /**
   * Initialize the context for the given font
   * 
   * @param {Object} options 
   * @param {Object} options.ctx 
   * @param {Object} options.task 
   * @param {Font} options.font 
   */
  static exec({ ctx, font, task }){
    return new Listr([
      {
        title: 'Recovering the manifest',
        task: (ctx, task) => FontInit.load(font)
      },
      {
        title: 'Setuping the system',
        task: (ctx, task) => FontInit.setup(font)
      }
    ])
  }

  /**
   * Load the font manifest if it exists 
   * 
   * @param {Font} font
   * @returns {Promise}
   */
  static load(font) {
    return font.load()
  }

  /**
   * Setup the system:
   *  - Create the font directory
   *  - Creating the icons directory
   *  - Creating the webfonts directory
   * 
   * @param {Font} font 
   * @returns {Promise}
   */
  static setup(font){
    return new Promise((resolve, reject) => {
      Promise.all([
        font.system,
        path.resolve(font.system, config.folder_icons),
        path.resolve(font.system, config.folder_webfont)
      ].map(p => FileSystemController.createDirectory(p)))
      .then(() => resolve())
      .catch(e => reject(e))
    })
  }
}