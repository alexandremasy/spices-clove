const ora = require('ora')
const path = require('path')
const fs = require('fs')
const util = require('util')
const mkdirp = require('mkdirp')
const axios = require('axios')
const rimraf = require('rimraf')
const { optimize } = require('svgo')
const Icon = require('../utils/icon')

module.exports = class FileSystemController {

  /**
   * @constructor
   */
  constructor(){
    this._icons = null

    this._spinner = ora();
    this._current = 0;
  }
  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * @property {Array} icons The list of available icons
   */
  get icons(){
    return this._icons
  }
  set icons(value){
    this._icons = value
  }

  /**
   * @property {Number} nIcons - Count the number of icons available
   */
  get nIcons(){
    return this._icons.length
  }

  /**
   * @property {Object} svgoConfig
   * @readonly
   */
  get svgoConfig(){
    return {
      plugins: [
        'cleanupAttrs',
        'removeDoctype',
        'removeXMLProcInst',
        'removeComments',
        'removeMetadata',
        'removeTitle',
        'removeDesc',
        // 'removeUselessDefs',
        'removeEditorsNSData',
        'removeEmptyAttrs',
        // 'removeHiddenElems',
        'removeEmptyText',
        'removeEmptyContainers',
        'removeViewBox',
        // 'cleanupEnableBackground',
        // 'convertStyleToAttrs',
        // 'convertColors',
        // 'convertPathData',
        // 'convertTransform',
        // 'removeUnknownsAndDefaults',
        'removeNonInheritableGroupAttrs',
        // 'removeUselessStrokeAndFill',
        // 'removeUnusedNS',
        // 'cleanupIDs',
        // 'cleanupNumericValues',
        // 'moveElemsAttrsToGroup',
        // 'moveGroupAttrsToElems',
        // 'collapseGroups',
        // 'removeRasterImages',
        // 'mergePaths',
        // 'convertShapeToPath',
        'sortAttrs',
        // 'removeDimensions',
        // { name: 'removeAttrs', attrs: '(stroke|fill)' },
      ]
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Create the output directory if it does not exists
   * 
   * @returns {Promise}
   */
  createOutputDirectory(){
    return new Promise((resolve, reject) => {
      mkdirp.sync(global.config.output)
      mkdirp.sync(global.config.icons)
      mkdirp.sync(global.config.iconfont)
      mkdirp.sync(global.config.outlined)

      return resolve()
    })
  }

  /**
   * Delete the given directory
   * 
   * @param {String|Path} dir 
   * @returns {Promise}
   */
  deleteDirectory(dir){
    return fs.existsSync(dir) ?
      new Promise((resolve, reject) => {
        rimraf(dir, (err) => err ? reject(err) : resolve())
      }) :
      Promise.resolve()
  }

  /**
   * Remove the existing output folders
   * 
   * @returns {Promise}
   */
  deleteOutputDirectories() {
    return new Promise((resolve, reject) => {
      this.deleteIconsDirectory()
        .then(this.deleteOutlineDirectory.bind(this))
        .then(this.deleteFontDirectory.bind(this))
        .then(() => {
          resolve()
        })
        .catch(e => reject(e))
    })
  }

  /**
   * Delete the output directory if it does exists
   * 
   * @returns {Promise}
   */
  deleteOutputDirectory(){
    return this.deleteDirectory(global.config.output)
  }

  /**
   * Delete the iconfont directory if it does exists
   * 
   * @returns {Promise}
   */
  deleteFontDirectory(){
    return this.deleteDirectory(global.config.iconfont)
  }

  /**
   * Delete the output icon directory if it does exists
   * 
   * @returns {Promise}
   */
  deleteIconsDirectory(){
    return this.deleteDirectory(global.config.icons)
  }

  /**
   * Delete the output icon outline directory if it does exists
   */
  deleteOutlineDirectory(){
    return this.deleteDirectory(global.config.outlined)
  }

  /**
   * Download the availabe icons
   */
  download(){
    return new Promise((resolve, reject) => {
      this._current = 0;
      this._spinner.start('Downloading')
      Promise.all(this.icons.map((i, j) => this.downloadImage({ index: j, icon: i })))
      .then(() => {
        this._spinner.succeed()
        resolve()
      })
      .catch(e => reject(e))
    })
  }
  
  /**
   * Download an image
   * 
   * @param {Object} options 
   * @param {Object} options.index The current index
   * @param {Icon} options.icon The icon
   * @param {Object} options.name The filename
   * @param {Object} options.url The file url to download 
   */
  downloadImage({index, icon}){
    return new Promise((resolve, reject) => {
      this._spinner.text = `Downloading ${this._current} / ${ this.nIcons }`
      
      const name = icon.name
      const url = icon.origin
      const image = path.resolve(global.config.icons, `${name}.svg`)
      icon.output = image
      
      const writer = fs.createWriteStream(image)
      
      axios.get(url, {
        responseType: 'stream'
      })
      .then((res) => {
        res.data.pipe(writer)
        this._current++ 
        this._spinner.text = `Downloading ${this._current} / ${ this.nIcons }`
        return resolve()
      })
      .catch((err) => {
        console.log('---------------')
        console.log('Download failed for:')
        console.log(name);
        console.log(url);
        console.log(err.message);
        console.log('---------------')
        return reject(e)
      })
    })
  }

  /**
   * Optimize all the icons with svgo
   */
  optimize(){
    return new Promise((resolve, reject) => {
      this._current = 0;
      this._spinner.start('Optimizing')
      Promise.all(this.icons.map((i, j) => this.optimizeIcon({ index: j, icon: i })))
        .then(() => {
          this._spinner.succeed()
          resolve()
        })
        .catch(e => reject(e))
    })
  }

  /**
   * Optimize the given icon with svgo
   * 
   * @param {*} icon 
   */
  optimizeIcon({index, icon}){
    return new Promise((resolve, reject) => {
      if (!icon.output){
        console.log('Unable to optimize icon without an output path: ', icon.output)
        console.log(icon)

        return reject()
      }

      const readFile = util.promisify(fs.readFile)
      const writeFile = util.promisify(fs.writeFile)

      readFile(icon.output, 'utf-8')
      .then(data => optimize(data, { path: icon.output, ...this.svgoConfig }))
      .then(res => {
        icon.data = res.data
        return writeFile(icon.output, res.data)
      })
      .then(data => {
        this._current++
        this._spinner.text = `Optimizing ${this._current} / ${this.nIcons}`
  
        return resolve()
      })
      .catch(e => {
        console.log('')
        console.log('optimization failed for', icon.output)
        return reject()
      })
    })
  }
}