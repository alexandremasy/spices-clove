const execute = require('../utils/execute');
const chalk = require('chalk');

class DeployStep {
  constructor() {
    this._config = require('../utils/config');
    this.existOnS3 = null;
  }

  set config(value) {
    this._config = value;
  }

  get config() {
    return this._config;
  }

  run() {
    return new Promise((resolve, reject) => {

      this.notOnS3()
        .then(this.s3.bind(this))
        .catch(err => {
          console.log(chalk.red('error'), err);
          process.exit(3);
        })

      return resolve();
    })
  }

  get filename() {
    let ret = `${this.config.name}-${this.config.next}.umd.min.js`;
    ret = ret.replace('@', '');
    ret = ret.replace('/', '-');
    ret = ret.split('.').join('-');

    return ret;
  }

  get bucketPath() {
    let [group, name] = this.config.name.split('/');
    return [this.config.s3_bucket, name].join('/');
  }

  /**
   * Whether the bundle already exists on s3
   * Resolve if config.s3 === false
   * Resolve if the file is not on s3 already
   * Reject if it is present on s3
   * Reject if an issue occured
   */
  notOnS3() {
    return this.config.s3 === true ?
      new Promise((resolve, reject) => {
        if (this.existOnS3 != null) {
          this.existOnS3 === true ? reject(`${this.filename} already exists on the s3 bucket`) : resolve();
          return;
        }

        let path = [this.bucketPath, this.filename].join('/');
        let command = `aws s3 ls ${path}`;
        this.config.debug && this.config.verbose && console.log(chalk.dim('deploy.notOnS3 >'), command);
        execute(command, { successCodes: [0, 1] })
          .then(({ response, code }) => {
            // 1 => file does not exists
            // 0 => file exits
            this.existOnS3 = code === 0
            this.config.debug && this.config.verbose && console.log(chalk.dim('deploy.notOnS3 <'), code, response);
            code === 1 ? resolve() : reject(`${this.filename} already exists on the s3 bucket`)
          })
          .catch(({ response, code }) => reject(response))
      }) : Promise.resolve(false);
  }

  s3() {
    return new Promise((resolve, reject) => {
      let command = `aws s3 cp dist ${this.bucketPath} --recursive`;
      this.config.debug && this.config.verbose && console.log(chalk.dim('deploy.s3 >'), command);
      execute(command)
      .then(({response}) => {
        this.config.debug && this.config.verbose && console.log(chalk.dim('deploy.s3 <'), response);
        resolve();
      })
      .catch(reject)
    })
  }
}

module.exports = DeployStep
