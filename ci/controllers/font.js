const path = require('path')
const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const { basil } = require('@spices/basil')

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
   * Trigger the download of the icons
   * 
   * @param {Object} options 
   * @returns 
   */
  download({ ctx, task }){
    return this.glyphIterator({ 
      ctx, 
      fn: 'download',
      n: 50,
      task,
      title: (i, n) => task.title = `Downloading the glyphs [${i}/${n}]`
    })
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
      this.download({ ctx, task })
      .then(this.outline.bind(this, {ctx, task}))
      .then(this.optimize.bind(this, {ctx, task}))
      // .then(this.fixGlyphsPath.bind(this, {ctx, task}))
      .then(() => {
        console.log('done')
        resolve()
      })
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
   * Create the outline version of the icon
   * 
   * @returns {Promise}
   */
  outline({ctx, task}){
    return this.glyphIterator({
      ctx,
      fn: 'outline',
      n: 10,
      task,
      title: (i, n) => task.title = `Outlining the glyphs [${i}/${n}]`
    })
  }

  /**
   * Create the outline version of the icon
   * 
   * @returns {Promise}
   */
  optimize({ ctx, task }) {
    return this.glyphIterator({
      ctx,
      fn: 'optimize',
      n: 50,
      task,
      title: (i, n) => task.title = `Optimizing the glyphs [${i}/${n}]`
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

  /**
   * Sync the figma information
   * 
   * @returns {Promise}
   */
  syncWithFigma({ ctx, task }) {
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
        .then(parse.bind(this))
        .then(download.bind(this))
        .then(() => {
          ctx.icons.forEach(i => this.font.addGlyph(i))

          delete ctx.document
          delete ctx.figmaId
          delete ctx.icons

          return resolve()
        })
    })
  }

  webfont(){
    return new Promise((resolve, reject) => {
      resolve()
    })
  }
}
