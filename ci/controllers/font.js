const path = require('path')
const util = require('util')
const fs = require('fs')
const Listr = require('listr')
const readFile = util.promisify(fs.readFile)

const Font = require('../models/font')
const FileSystemController = require('./fs')
const FigmaController = require('./figma')
const config = require('../utils/config')

module.exports = class FontController {

  /**
   * @constructor
   * @param {Font} font 
   */
  constructor(font){
    this.font = font
  }

  /**
   * 
   * 
   * @returns {Promise}
   */
  syncWithFigma({ctx, task}){
    return new Promise((resolve, reject) => {
      const figma = new FigmaController()
      ctx.figmaId = this.font.figmaId

      let fetch = () => new Promise((resolve, reject) => {
        task.title = 'Fetching the Figma document'
        figma.fetch(ctx)
        .then(() => resolve())
      })

      let parse = () => new Promise((resolve, reject) => {
        task.title = 'Hunting down glyphs in the document'
        figma.findIcons(ctx)
        .then(() => resolve())
      })

      let download = () => new Promise((resolve, reject) => {
        task.title = 'Generating the download links'
        figma.computeImageList(ctx)
        .then(() => resolve())
      })


      fetch()
      .then( parse.bind(this) )
      .then( download.bind(this) )
      .then(() => {
        ctx.icons.forEach(i => this.font.addGlyph(i))

        delete ctx.document
        delete ctx.figmaId
        delete ctx.icons

        return resolve()
      })
    })
  }

  /**
   * Load the font manifest if it exists 
   * @returns {Promise}
   */
  load() {
    return new Promise((resolve, reject) => {
      let p = path.resolve(config.output, this.font.name, `manifest.json`)

      // Never been generated
      if (!fs.existsSync(p)) {
        return Promise.resolve()
      }

      readFile(p, 'utf-8')
        .then(data => {
          data = JSON.parse(data)
          this.font.parse(data)
          resolve()
        })
        .catch(e => {
          console.log('[ERR]', e)
          reject(e)
        })
    })
  }

  /**
   * Create the condition to build the font
   * - load & parse the manifest
   * - make sure the output paths exists
   * - remove previous generated files
   * 
   * @returns {Promise}
   */
  reset() {
    return new Promise((resolve, reject) => {
      const fsc = new FileSystemController()
      let root = path.resolve(config.output, this.name)
      let icons = path.resolve(root, config.folder_icons)
      let webfont = path.resolve(root, config.folder_webfont)

      this.load()
        .then(fsc.createDirectory.bind(fsc, root))
        .then(fsc.deleteDirectory.bind(fsc, icons))
        .then(fsc.deleteDirectory.bind(fsc, webfont))
        .then(fsc.createDirectory.bind(fsc, icons))
        .then(fsc.createDirectory.bind(fsc, webfont))
        .then(() => resolve())
        .catch(e => reject(e))
    })
  }
}
