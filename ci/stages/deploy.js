const execute = require('../utils/execute');
const chalk = require('chalk');
const ora = require('ora');

const FigmaController = require('../controllers/figma')
const FileSystemController = require('../controllers/fs')
const TemplatesController = require('../controllers/templates')

class DeployStep {

  /**
   * @constructor
   * @param {Object} options 
   * @param {FileSystemController} options.fs
   * @param {FigmaController} options.figma
   * @param {TemplatesController} options.templates
   */
  constructor({ config, fs, figma, templates }) {
    this._config = config
    this._spinner = ora();
  }

  /**
   * Deploy the build version
   * 
   * - On S3
   * - On NPM
   * - Push to the repository
   */
  run() {
    return new Promise((resolve, reject) => {
      console.log('---Deploy---');
        
        this.s3()
        .then(this.npm.bind(this))
        .catch(err => {
          console.log(chalk.red('error'), err);
          process.exit(3);
        })

      return resolve();
    })
  }

  npm(){
    return new Promise((resolve, reject) => {
      this._spinner.start('publishing on npm')

      // Make sure we have a changelog to avoid publishing a false positive
      if (this._config.changelog === null || this._config.changelog !== null && !this._config.changelog.hasChanges){
        this._spinner.info('nothing to publish on npm')
        return resolve()
      }

      let command = `yarn publish --new-version ${this._config.next}`
      execute(command, { verbose: false })
      .then(() => {
        this._spinner.succeed()
        return resolve()
      })
      .catch(e => {
        this._spinner.fail()
        return reject(e)
      })
    })
  }

  repository() {
    return new Promise((resolve, reject) => {
      let command = `git push origin ${this.config.branch} --tags --quiet`
      execute(command, { verbose: false })
        .then(resolve)
        .catch(reject)
    })
  }

  s3() {
    return new Promise((resolve, reject) => {
      this._spinner.start('Uploading to s3')
      let command = `aws s3 cp src/spices-icons.svg ${this._config.s3_bucket}`;
      execute(command)
      .then(({response}) => {
        this._spinner.succeed()
        resolve();
      })
      .catch(e => {
        this._spinner.fail()
        reject(e)
      })
    })
  }
}

module.exports = DeployStep
