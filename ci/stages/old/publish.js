const https = require('https');
const chalk = require('chalk');
const ora = require('ora');

module.exports = class PublishStep {
  /**
   * @constructor
   * @param {Object} options 
   * @param {FileSystemController} options.fs
   * @param {FigmaController} options.figma
   * @param {TemplatesController} options.templates
   */
  constructor({ config, fs, figma, templates }) {
    this._spinner = ora();
  }

  /**
   * Publishing the new version
   * - On Discord
   */
  run() {
    return new Promise((resolve, reject) => {
      console.log('---Deploy---');

      this.discord()
      .then(() => {
        return resolve();
      })
      .catch(err => {
        console.log(chalk.red('error'), err);
        process.exit(3);
      })
    })
  }

  discord() {
    return new Promise((resolve, reject) => {
      if (global.config.changelog === null || (global.config.changelog && !global.config.changelog.hasChanges)) {
        this._spinner.info('Nothing to publish on discord')
        return resolve()
      }

      let params = {
        content: `**${global.config.name}** \`${global.config.next}\` \n\n Changelog: \n${global.config.changelog.toString()}`,
        username: 'Jenkins',
        avatar_url: global.config.avatar,
        embeds: []
      }

      if (global.config.npm){
        params.embeds.push({
          title: 'View it on npm',
          url: `https://npm.infinity-commerce.io/-/web/detail/${global.config.name}`
        })
      }

      const data = JSON.stringify(params);
      const options = {
        hostname: 'discordapp.com',
        port: 443,
        // path: '/api/webhooks/742318702997012550/PKufWxrY_X9Oc1XzREac__JJFUuNXpV9_1Z3Y0WwYtl-4WXAHJD8q9Q2RjowAC1Jc3h7',
        path: '/api/webhooks/814724599954538506/KWKkWmiGcpmPBdVokmV5XvuOTybGHJw7N4XP40SRAXr3qDs-hr6_nPCNszuPpBqHnA3I',
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
