const chalk = require('chalk')
const defaults = require('../helpers/defaults')
const fs = require('fs')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const prompts = require('prompts')
const promptsList = require('../helpers/prompts')
const ora = require('ora')

/**
 * @class
 */
module.exports = class ConfigController{
  
  /**
   * @constructor
   */
  constructor(){
    this._data = {}

    this._spinner = ora();
  }

  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * @property {Object} data The configuration value
   */
  get data(){
    return this._data
  }

  /**
   * @property {Boolean} exists Whether or not the configuration file exists
   */
  get exists(){
    return fs.existsSync(this.file)
  }

  /**
   * The config file path
   * 
   * @returns {Path}
   */
  get file() {
    return path.resolve(argv.config || defaults.configFileName)
  }

  /**
   * @property {Boolean} valid Whether or not the current config is valid and complete
   */
  get valid() {
    return promptsList.filter((q) => !this._data[q.name]).length === 0
  }

  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Create or complete the configuration file using a prompt
   * 
   * @return {Promise}
   */
  create(fields = promptsList){
    return new Promise((resolve, reject) => {
      const onCancel = prompt => {
        console.error('An issue occured while creating the configuration file');
        console.info('prompt', prompt);
        reject({error: prompt})
      }
  
      prompts(fields, { onCancel })
      .then(response => {
        this._data = Object.assign(this._data, response)
        fs.writeFileSync(this.file, JSON.stringify(this._data, null, 2))
      })
      .finally(() => resolve())
    })
  }

  /**
   * Delete an existing configuration file
   * 
   * @returns {Promise}
   */
  delete(){
    return new Promise((resolve) => {
      if (this.exists) {
        fs.unlinkSync(this.file)
  
        console.log(chalk.cyan.bold('Deleted previous config'))
        return resolve()
      }
    })
  }

  /**
   * Retrieve the configuration file
   * - Rejection: If the configuration file does not exists
   * 
   * @returns {Promise}
   */
  fetch(){
    return new Promise((resolve, reject) => {
      if (!this.exists) {
        return reject();
      }

      this._data = JSON.parse( fs.readFileSync(this.file, 'utf-8') )
      resolve()
    })
  }

  /**
   * Run for the configuration
   * 
   * @returns {Promise}
   */
  run(){
    return new Promise((resolve, reject) => {
      this.fetch()
        .then(() => this.valid ? Promise.resolve() : this.create())
        .then(() => {
          this._spinner.succeed('Warming up')
          return resolve()
        })
        .catch(e => {
          this._spinner.fail('Warming up')
          return reject(e)
        })
    })
  }
}