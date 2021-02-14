const ora = require('ora')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const axios = require('axios')
const rimraf = require('rimraf')
const svgstore = require('svgstore')

module.exports = class FileSystemController {

  /**
   * @constructor
   * @param {Object} config
   */
  constructor(config){
    this._config = config;
    this._icons = null

    this._spinner = ora();
    this._current = 0;
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
      this._spinner.start('Downloading')
      Promise.all(this.icons.map((i, j) => this.downloadImage({ index: j, name: i.name, url: i.path })))
      .then(() => resolve())
      .catch(e => reject(e))
    })
  }
  
  /**
   * Download an image
   * 
   * @param {Object} options 
   * @param {Object} options.index The current index
   * @param {Object} options.name The filename
   * @param {Object} options.url The file url to download 
   */
  downloadImage({index, name, url}){
    return new Promise((resolve, reject) => {
      this._spinner.text = `Downloading ${this._current} / ${ this.nIcons }`
      
      const image = path.resolve(this.outputPath, 'icons', `${name}.svg`)
      const writer = fs.createWriteStream(image)
      
      axios.get(url, {responseType: 'stream'})
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
   * Run the download to the filesyste:
   * - creating the output directory
   * - purging the previous icons
   * 
   * @returns {Promise}
   */
  run(){
    return new Promise((resolve, reject) => {
      this.download.bind(this)
      .then(() => {
        this._spinner.succeed();
        this._spinner.start('Creating the sprite')
      })
      .then( this.sprite.bind(this) )
      .then(() => {
        this._spinner.succeed()
        return resolve()
      })
      .catch(e => reject(e))
    })
  }

  /**
   * Create the svg sprite
   * 
   * @returns {Promise}
   */
  sprite(){
    return new Promise((resolve, reject) => {
      let s = svgstore()
      
      this.icons.forEach(({name}) => {
        let image = path.resolve(this.outputPath, 'icons', `${name}.svg`)
        s.add(name, fs.readFileSync(image, 'utf8'))
      })
      
      fs.writeFileSync( path.resolve(this.outputPath, './sprites.svg'), s);
      return resolve()
    })
  }
}