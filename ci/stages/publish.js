const execute = require('../utils/execute');
const https = require('https');

class PublishStep {
  /**
   * @constructor
   * @param {Object} options 
   * @param {FileSystemController} options.fs
   * @param {FigmaController} options.figma
   */
  constructor() {
    this._config = require('../utils/config');
  }

  set config(value) {
    this._config = value;
  }

  get config() {
    return this._config;
  }

  run() {
    return this.repository()
      .then(this.config.discord ? this.discord.bind(this) : Promise.resolve)
      .catch(err => {
        console.log(err)
        process.exit(4);
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

  discord() {
    return new Promise((resolve, reject) => {
      let params = {
        content: `**${this.config.name}** \`${this.config.next}\` published`,
        username: 'Jenkins',
        avatar_url: this.config.avatar,
        embeds: []
      }

      if (this.config.npm){
        params.embeds.push({
          title: 'View it on npm',
          url: `https://npm.infinity-commerce.io/-/web/detail/${this.config.name}`
        })
      }

      const data = JSON.stringify(params);
      const options = {
        hostname: 'discordapp.com',
        port: 443,
        path: '/api/webhooks/742318702997012550/PKufWxrY_X9Oc1XzREac__JJFUuNXpV9_1Z3Y0WwYtl-4WXAHJD8q9Q2RjowAC1Jc3h7',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      }

      const req = https.request(options, (res) => {
        res.on('data', (d) => {
          process.stdout.write(d);
        });

        resolve();
      })

      req.on('error', (error) => {
        reject(error);
      })

      req.write(data)
      req.end();
    })
  }

}


module.exports = PublishStep;
