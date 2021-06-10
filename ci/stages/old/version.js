const semver = require('semver');
const execute = require('../utils/execute');
const ora = require('ora');

const TemplatesController = require('../controllers/templates');
const FigmaController = require('../controllers/figma');
const FileSystemController = require('../controllers/fs');
const Changelog = require('../utils/changelog')

module.exports = class VersionStep {
  /**
   * @constructor
   * @param {Object} options 
   * @param {FileSystemController} options.fs
   * @param {FigmaController} options.figma
   * @param {TemplatesController} options.templates
   */
  constructor({ config, fs, figma, templates }) {
    global.config = config
    this._templates = templates

    this.tagVersion = '0.0.0';

    this._changelog = null
    this._spinner = ora();
  }
  
  ///////////////////////////////////////////////////

  get hasChanges(){
    return global.config.changelog === null || (global.config.changelog && global.config.changelog.hasChanges)
  }
  
  ///////////////////////////////////////////////////

  /**
   * Version the package
   * 
   * - Proactivaly add new file from the output folder
   * - Build the list of changes
   * - Commit the changes
   */
  run() {
    console.log('---Version---');

    return new Promise((resolve, reject) => {

      this.addFiles()
      .then( this.getChanges.bind(this) ) 
      .then( this.commit.bind(this) )
      .then(() => {
        resolve()
      })
      .catch(e => {
        console.log(e)
        process.exit(4)
      })
    })
  }

  /**
   * Add the new icons automatically
   * 
   * @returns {Promise}
   */
  addFiles(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Add new files')

      let command = `git add ${global.config.icons}`
      return execute(command)
      .then(() => {
        this._spinner.succeed()
        return resolve()
      })
    })
  }

  /**
   * Commit the changes
   */
  commit(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Commiting the icon change(s)')

      if (global.config.changelog === null || global.config.changelog !== null && !global.config.changelog.hasChanges) {
        this._spinner.info('No changes detected')
        return resolve()
      }

      let command = `git commit ${global.config.output} -m "${this.changelog}"`
      execute(command, { verbose: false })
      .then((res) => {
        this._spinner.succeed()
        return resolve()
      })
      .catch(e => reject(e))
    })
  }

  /**
   * Retrieve the list of changed files with the latest build
   * 
   * @returns {Promise}
   */
  getChanges(){
    return new Promise((resolve,  reject) => {
      this._spinner.start('Computing the changelog')
      
      // let command = 'git diff --name-status --staged src/icons'
      let command = `git status -s --porcelain --no-renames ${global.config.icons}`
      execute(command, { verbose: false })
      .then((res) => {
        let data = res.response
        data = data.split('\n').filter(d => d.trim().length > 0)

        this._changelog = data.map(e => {
          let flag = e.substr(0, 1)
          let path = e.substr(e.indexOf('src'))
          let name = e.substring(e.indexOf('src') + 10, e.indexOf('.svg'))
          
          return {
            added: flag === 'A',
            deleted: flag === 'D',
            modified: flag === 'M',

            name,
            path
          }
        })

        this._changelog.sort((a, b) => ('' + a.name).localeCompare(b.name))
        global.config.changelog = this._changelog = new Changelog(this._changelog)

        this._spinner.succeed();
        return resolve()
      })
    })
  }
}