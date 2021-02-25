const chalk = require('chalk');

const FileSystemController = require('./controllers/fs')
const FigmaController = require('./controllers/figma')
const TemplatesController = require('./controllers/templates')

class CI {
  constructor() {
    this._config = require('./utils/config'); 
    global.config = this._config;

    this._fs = new FileSystemController();
    this._figma = new FigmaController();
    this._templates = new TemplatesController();

    let args = { config: this._config, fs: this._fs, figma: this._figma, templates: this._templates }
    this._before = new (require('./stages/before'))(args);
    this._version = new (require('./stages/version'))(args);
    this._publish = new (require('./stages/publish'))(args);
    this._build = new (require('./stages/build'))(args);
    this._deploy = new (require('./stages/deploy'))(args);
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

    return this.before()
      .then(this.build.bind(this))
      .then(this.version.bind(this))
      // .then(this.deploy.bind(this))
      // .then(this.publish.bind(this))
      .catch(e => {
        console.log(e);
      })
  }

  /**
   * 
   */
  before(){
    return this._before.run()
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
    return this._build.run()
  }

  deploy() {
    return this._version.hasChanges ? this._deploy.run() : Promise.resolve()
  }

  publish() {
    return this._version.hasChanges ? this._publish.run() : Promise.resolve()
  }

  version() {
    return this._version.run()
  }
}

const ci = new CI();
ci.run(process.argv.slice(2));
