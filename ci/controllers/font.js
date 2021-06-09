const path = require('path')
const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const { basil } = require('@spices/basil')

const Font = require('../models/font')
const FileSystemController = require('./fs')
const FigmaController = require('./figma')
const WebfontController = require('./webfont')
const config = require('../utils/config')
const PublishController = require('./publish')

module.exports = class FontController {

  /**
   * @constructor
   * @param {Font} font 
   */
  constructor(font){
    this.font = font
  }


  /**
   * Publish the new version of the font
   * 
   * @returns {Promise}
   */
  publish({ctx, task}){
    return new Promise((resolve, reject) => {
      PublishController.send({ font: this.font })
      .then(() => resolve())
      .catch((e) => console.error(e))
    })
  }

 
  /**
   * Create the webfont
   * 
   * @returns {Promise}
   */
  webfont(){
    return new Promise((resolve, reject) => {

      WebfontController.create({ font: this.font })
      .then(() => {
        return resolve()
      })
      .catch(e => {
        console.log(e);
        return reject(e);
      })
    })
  }
}
