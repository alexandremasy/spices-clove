const chalk = require('chalk');

const FileSystemController = require('./controllers/fs')
const FigmaController = require('./controllers/figma')

class CI {
  constructor() {
    this._config = require('./utils/config'); 
    this._fs = new FileSystemController(this._config);
    this._figma = new FigmaController(this._config);

    let args = { config: this._config, fs: this._fs, figma: this._figma }
    this._before = new (require('./stages/before'))(args);
    this._version = new (require('./stages/version'))(args);
    this._publish = new (require('./stages/publish'))(args);
    this._build = new (require('./stages/build'))(args);
    this._deploy = new (require('./stages/deploy'))(args);
  }

  /**
   * Retrieve the configuration
   * 
   * @returns {Promise}
   */
  getConfig() {
    return new Promise((resolve, reject) => {
      this._config.run()
        .then(() => {
          this._figma.config = this._config.data
          this._fs.config = this._config.data

          resolve()
        })
        .catch(e => reject(e))
    })
  }

  parse(argv) {
    let steps = ['before', 'build', 'deploy', 'publish', 'version'];
    let valids = steps.concat(['--debug', '--verbose']);
    let others = argv.filter(arg => !valids.includes(arg));

    if (others.length) {
      console.log(chalk.bold(`Usage: yarn ci [step] [...flags]`));
      console.log();
      console.log(chalk.italic('steps:'));
      console.log(chalk.blue('    before'), '\t Sanity checks for publishing a new version.');
      console.log(chalk.blue('    build'), '\t Bundle the module.');
      console.log(chalk.blue('    deploy'), '\t Deploy the bundle. Either s3, webserver...');
      console.log(chalk.blue('    publish'), '\t Make sure everyone knows about the bundle deploiement.');
      console.log(chalk.blue('    version'), '\t Finds out the proper version of the bundle.');
      console.log();
      console.log(chalk.italic('flags:'));
      console.log(chalk.blue('    --debug'), '\t Prints out the debug informations');
      console.log(chalk.blue('    --verbose'), '\t Prints out more debug informations. Only if the debug flag is set.');
      console.log();

      process.exit(1);
    }

    let ret = {
      debug: argv.includes('--debug'),
      verbose: argv.includes('--verbose'),
      step: argv.find(arg => steps.includes(arg))
    }

    return ret
  }

  run(argv) {
    let params = this.parse(argv);

    if (params.step && params.step.length > 0) {
      let fn = null;
      switch (params.step) {
        case 'before':
          fn = this.before; break;
        case 'build':
          fn = this.build; break;
        case 'deploy':
          fn = this.deploy; break;
        case 'publish':
          fn = this.publish; break;
        case 'version':
          fn = this.version; break;
      }

      if (!fn) {
        console.log(chalk.red('Unkown step: %s'), params.step);
        process.exit(1);
      }

      this._config.debug && console.log('ci.step', params.step)

      return fn.call(this)
        .catch(e => console.log(e))
    }

    this.spinner.text = 'probing the env';
    
    return this.before(this._config.debug)
      .then(this.version.bind(this))
      .then(this.sanity.bind(this))
      .then(this.build.bind(this))
      .then(this.deploy.bind(this))
      .then(this.publish.bind(this))
      .catch(e => {
        console.log(e);
      })



    this.getConfig()
      .then(this.getIcons.bind(this))
      .then(this.fetchIcons.bind(this))
      .catch(e => console.error(e))
  }

  before(){
    return new Promise((resolve, reject) => {
      this._before.run()
        .then(() => resolve())
        .catch(e => reject(e))
    })
  }

  /**
   * Make sure everything gonna be ok with the build and deploy
   * 
   * - The new version is not already on s3 (if config.s3 === true)
   */
  sanity() {
    return new Promise((resolve, reject) => {
      this.spinner.start('sanity checks');
      let p = this._config.s3 === true ? this._deploy.notOnS3.bind(this._deploy) : Promise.resolve;
      p()
        .then(() => {
          this.spinner.succeed('sane context')
          resolve();
        }).catch((e) => {
          this.spinner.fail(e)
          reject(e);
        });
    })
  }

  build() {
    return new Promise((resolve, reject) => {
      this._build.run()
        .then(() => resolve())
        .catch(e => reject(e))
    })
  }

  deploy() {
    this.spinner.start('deploying')
    return this._deploy.run()
      .then(() => this.spinner.succeed('deployed'))
  }

  publish() {
    this.spinner.start('publishing')
    return this._publish.run(this.next)
      .then(() => this.spinner.succeed('published'))
  }

  version() {
    this.spinner.start('versionning');

    return this._version.run.apply(this._version)
      .then((v) => {
        this.update();
        this.spinner.succeed(`${this._config.name}: ${this._config.version} -> ${this._config.next}`)
      })
  }
}

const ci = new CI();
ci.run(process.argv.slice(2));
