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
    this._spinner = ora();
    this._current = 0;
  }
  
  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Create the given directory
   * 
   * @param {String} dir 
   * @returns {Promise}
   */
  createDirectory(dir){
    return new Promise((resolve, reject) => {
      mkdirp.sync(dir)
      resolve()
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
   * Download the availabe icons
   */
  download(){
    return new Promise((resolve, reject) => {
      this._current = 0;
      this._spinner.start('Downloading')
      Promise.all(global.config.list.map((i, j) => this.downloadImage({ index: j, icon: i })))
      .then(() => {
        this._spinner.succeed()
        resolve()
      })
      .catch(e => reject(e))
    })
  }
  
  /**
   * Optimize all the icons with svgo
   */
  optimize(){
    return new Promise((resolve, reject) => {
      this._current = 0;
      this._spinner.start('Optimizing')
      Promise.all(global.config.list.map((i, j) => this.optimizeIcon({ index: j, icon: i })))
        .then(() => {
          this._spinner.succeed()
          resolve()
        })
        .catch(e => reject(e))
    })
  }

  /**
   * Find out the list of icons locally.
   * From the output sources deduct the list of icons.
   * It allow debugging the other steps more easier.
   * 
   * @private
   * @returns {Promise}
   */
  prepare(){
    return new Promise((resolve, reject) => {
      const readdir = util.promisify(fs.readdir)
      
      readdir(global.config.icons)
      .then((list) => {
        const icons = list.map(i => {
          let output = path.resolve(global.config.icons, i);
          let name = i.substring(0, i.indexOf('.'))
          let data = fs.readFileSync(output, 'utf-8')

          return new Icon({ 
            category: null,
            data,
            id: Math.random().toString(36).substring(7),
            name,
            output
          })
        })

        global.config.list = icons
        console.log('icons => ', global.config.list.length)

        return resolve()
      })
      .catch(e => reject(e))
    })
  }
}