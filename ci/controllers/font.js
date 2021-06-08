const path = require('path')
const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const { basil } = require('@spices/basil')

const Font = require('../models/font')
const FileSystemController = require('./fs')
const FigmaController = require('./figma')
const WebfontController = require('./webfont')
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
   * Fetch the icons
   *  - Download the glyphs
   *  - Generate the outlines
   *  - Optimize the glyphs
   *  - Fix the paths
   */
  fetch({ctx, task}){
    return new Promise((resolve, reject) => {

      this.glyphIterator({ ctx, fn: 'download', n: 50, task, title: (i, n) => task.title = `Downloading the glyphs [${i}/${n}]`})
      // .then(this.glyphIterator.bind(this, { ctx, fn: 'outline', n: 10, task, title: (i, n) => task.title = `Outlining the glyphs [${i}/${n}]`}))
      // .then(this.glyphIterator.bind(this, { ctx, fn: 'optimize', n: 50, task, title: (i, n) => task.title = `Optimizing the glyphs [${i}/${n}]`}))
      .then(this.fixGlyphsPath.bind(this, {ctx, task}))
      .then(() => {
        resolve()
      })
    })
  }

  /**
   * Sync the figma information
   * - Fetching the figma document
   * - Hunting down the glyphs in the document
   * - Generating the download links
   * 
   * @returns {Promise}
   */
  figma({ ctx, task }) {
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

      let unicodes = () => new Promise((resolve, reject) => {
        task.title = 'Computing the unicodes'
        this.font.computeUnicodes()
        resolve()
      })

      let download = () => new Promise((resolve, reject) => {
        task.title = 'Generating the download links'
        figma.computeImageList(ctx)
          .then(() => resolve())
      })

      fetch()
        .then(parse.bind(this))
        .then(download.bind(this))
        .then(() => {
          ctx.icons.forEach(i => this.font.addGlyph(i))
          
          delete ctx.document
          delete ctx.figmaId
          delete ctx.icons
        })
        .then(unicodes.bind(this))
        .then(() => resolve())
    })
  }

  /**
   * Fix the order of points in the glyphs
   * 
   * @param {Object} options 
   * @param {Object} options.ctx 
   * @param {Object} options.task 
   */
  fixGlyphsPath({ ctx, task }){
    return new Promise((resolve, reject) => {
      const execute = require('../utils/execute')

      let script = path.resolve(__dirname, '../outline.py')
      let p = path.resolve(__dirname, `../../src/${this.font.name}/${config.folder_icons}/`)
      let command = `fontforge -lang=py -script ${script} ${p}`
      execute(command, { verbose: false })
        .then(() => {
          return resolve()
        })
        .catch(e => {
          console.log('Error')
          console.log(e)
        })
    })
  }

  /**
   * Iterate over all the glyphs to execute a promise function
   * 
   * @param {Object} options 
   * @param {Object} options.ctx 
   * @param {Object} options.fn 
   * @param {Object} options.n 
   * @param {Object} options.task 
   * @param {Object} options.title
   */
  glyphIterator({ctx, fn, n = 10, task, title}){
    return new Promise((resolve, reject) => {
      let i = 0
      let n = this.font.glyphs.length
      title(i, n)

      let iterator = (g) => new Promise((resolve, reject) => {
        g[fn]().then(() => {
          i++; title(i, n); return resolve()
        })
      })

      let tasks = this.font.glyphs.map(g => iterator.bind(this, g))
      basil.sequence(tasks, n)
        .then(() => resolve())
        .catch(e => { console.error(e); return reject(e); })
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
        return resolve()
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
   * Publish the new version of the font
   * - Compute the new version (auto-patch until better changelog detection)
   * - Create the manifest
   * - Create the version
   * - Publish the font to npm
   * - Publish the font to s3
   */
  publish({ctx, task}){
    return new Promise((resolve, reject) => {
      
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
