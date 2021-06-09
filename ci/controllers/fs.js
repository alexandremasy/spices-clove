const fs = require('fs')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')

module.exports = class FileSystemController {

  /**
   * Create the given directory
   * 
   * @param {String} dir 
   * @returns {Promise}
   */
  static createDirectory(dir){
    return new Promise((resolve, reject) => {
      mkdirp.sync(dir)
      resolve()
    })
  }

  /**
   * Delete the given directory
   * 
   * @param {String} dir 
   * @returns {Promise}
   */
  static deleteDirectory(dir){
    return fs.existsSync(dir) ?
      new Promise((resolve, reject) => {
        rimraf(dir, (err) => err ? reject(err) : resolve())
      }) :
      Promise.resolve()
  }
}