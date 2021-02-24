const ora = require('ora')
const path = require('path')
const fs = require('fs')
const util = require('util')
const mkdirp = require('mkdirp')
const axios = require('axios')
const rimraf = require('rimraf')
const svgstore = require('svgstore')
const { optimize } = require('svgo')
const Icon = require('../utils/icon')

module.exports = class FileSystemController {

  /**
   * @constructor
   */
  constructor(){
    this._config = global.config;
    this._icons = null

    this._spinner = ora();
    this._current = 0;

    this._svgoConfig = {
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
        'removeHiddenElems',
        'removeEmptyText',
        'removeEmptyContainers',
        'removeViewBox',
        'cleanupEnableBackground',
        'convertStyleToAttrs',
        'convertColors',
        'convertPathData',
        'convertTransform',
        'removeUnknownsAndDefaults',
        'removeNonInheritableGroupAttrs',
        'removeUselessStrokeAndFill',
        'removeUnusedNS',
        'cleanupIDs',
        'cleanupNumericValues',
        'moveElemsAttrsToGroup',
        'moveGroupAttrsToElems',
        'collapseGroups',
        'removeRasterImages',
        'mergePaths',
        'convertShapeToPath',
        'sortAttrs',
        'removeDimensions',
        { name: 'removeAttrs', attrs: '(stroke|fill)' },
      ]
    }
  }
  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * @property {Object} config 
   */
  get config(){ 
    return this._config 
  }
  set config(value){
    this._config = value
  }

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
   * @property {Path} iconPath
   * @readonly
   */
  get outputPath(){
    return path.resolve(this._config.output)
  }

  /**
   * @property {Boolean} outputPathExists Whether or not the output directory exists
   */
  get outputPathExists(){
    return fs.existsSync(this.outputPath)
  }

  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Create the output directory if it does not exists
   * 
   * @returns {Promise}
   */
  createOutputDirectory(){
    return new Promise((resolve, reject) => {
      mkdirp.sync(this.outputPath)
      mkdirp.sync(path.resolve(this.outputPath, 'icons'))

      resolve()
    })
  }

  /**
   * Delete the output directory fi it does exists
   * 
   * @returns {Promise}
   */
  deleteOutputDirectory(){
    return this.outputPathExists ? 
           new Promise((resolve, reject) => {
             rimraf(this.outputPath, (err) => err ? reject(err) : resolve())
           }) :
           Promise.resolve()
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
      const image = path.resolve(this.outputPath, 'icons', `${name}.svg`)
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
      .then(data => optimize(data, { path: icon.output }))
      .then(res => writeFile(icon.output, res.data))
      .then(data => {
        this._current++
        this._spinner.text = `Optimizing ${this._current} / ${this.nIcons}`
  
        return resolve()
      })
      .catch(e => {
        console.log('optimization failed for', icon.output)
        return resolve()
      })
    })
  }


  /**
   * Create the icons variable list
   * 
   * @returns {Promise}
   */
  scss(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Creating the scss')

      let icons = this.icons.map(i => i.name)
      let data = ''
      data += `$spices-icon-path: '//cdn.sayl.cloud/spices/spices-icons/2.0.0';`
      data += `\n$spices-icon-version: '2.0.0';`
      data += `\n`
      data += `\n$spices-icon-icons: (\n\t${ icons.join(', \n\t') }\n);`

      fs.writeFileSync(path.resolve(this.outputPath, './spices-icons.scss'), data)

      this._spinner.succeed()
      resolve()
    })
  }

  /**
   * Create the svg sprite
   * 
   * @returns {Promise}
   */
  sprite(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Creating the sprite')

      let s = svgstore()
      let output = path.resolve(this.outputPath, './spices-icons.svg')
      
      this.icons.forEach(({name}) => {
        let image = path.resolve(this.outputPath, 'icons', `${name}.svg`)
        s.add(name, fs.readFileSync(image, 'utf8'))
      })

      let result = optimize(s.toString(), {
        path: output,
        ...this._svgoConfig
      })

      fs.writeFileSync( output, result.data );
      
      this._spinner.succeed()
      return resolve()
    })
  }

  vue(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Creating the vue components')
      let output = path.resolve(this.outputPath, './spices-icons.svg')
      let sprite = fs.readFileSync(output, 'utf8')

      let data = `<template>
  ${sprite}
</template>

<script>
// 
// Warning: Auto-generated file please do not edit directly
// 
export default {
  name: 'SpicesIconSprite'
}
</script>
      `

      fs.writeFileSync(path.resolve(this.outputPath, 'spices-icons-sprite.vue'), data)
      this._spinner.succeed();
      return resolve()
    })
  }
}