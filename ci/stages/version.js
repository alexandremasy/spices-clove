const semver = require('semver');
const execute = require('../utils/execute');
const ora = require('ora');
const TemplatesController = require('../controllers/templates');
const FigmaController = require('../controllers/figma');
const FileSystemController = require('../controllers/fs');

class VersionStep {
  /**
   * @constructor
   * @param {Object} options 
   * @param {FileSystemController} options.fs
   * @param {FigmaController} options.figma
   * @param {TemplatesController} options.templates
   */
  constructor({ config, fs, figma, templates }) {
    this._config = config
    this._templates = templates

    this.tagVersion = '0.0.0';
    this._changelog = null
    this._spinner = ora();
  }

  ///////////////////////////////////////////////////
  
  get changelog(){
    let ret = this._changelog.map(c => {
      let action = ''
      if (c.deleted) action = 'removed'
      if (c.added) action = 'added'
      if (c.modified) action = 'updated'

      return `icon ${c.name} ${action}`
    })

    return ret.join('\n')
  }

  /**
   * @property {Boolean} hasChanges Whether or not the latest build generated some changes to publish 
   */
  get hasChanges(){
    return this._changelog && this._changelog.length > 0
  }
  
  ///////////////////////////////////////////////////

  /**
   * Version the package
   * 
   * - Proactivaly add new file from the output folder
   * - Build the list of changes
   * - Build the changelog (x)
   * - Commit the changes
   * - Bump minor if changes
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

    // return this.getLatestVersionTag()
    //   .then(this.getRelease.bind(this))
    //   .then(this.getNextVersion.bind(this))
    //   .then(this.version.bind(this))
    //   .catch(e => {
    //     console.log(e)
    //     process.exit(0);
    //   });
  }

  /**
   * Add the new icons automatically
   * 
   * @returns {Promise}
   */
  addFiles(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Add new files')

      let command = 'git add src/icons'
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
      let command = 'git status -s --porcelain --no-renames src/icons'
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

        this._changelog.sort((a, b) => a.name > b.name)
        console.log(this.changelog)

        this._spinner.succeed();
        return resolve()
      })
    })
  }

  /**
   * Update the version number
   */
  version() {
    return new Promise((resolve, reject) => {
      let command = `yarn version --new-version ${this._config.next} --quiet`;
      execute(command)
        .then(resolve)
        .catch(reject)
    })
  }
}
module.exports = VersionStep
