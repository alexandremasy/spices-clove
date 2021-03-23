const chalk = require('chalk');
const Font = require('./models/font')

class CI {
  constructor() {
    global.config = require('./utils/config');  
    global.fonts = [
      new Font({ name: 'pepper-regular', figmaId: 'U2TtGONui0MxqNh6fo0QVX' })
    ]

    let args = {}
    this._before = new (require('./stages/before'))(args);
    this._version = new (require('./stages/version'))(args);
    this._publish = new (require('./stages/publish'))(args);
    this._build = new (require('./stages/build'))(args);
    this._deploy = new (require('./stages/deploy'))(args);

    this._params = null
  }

  parse(argv) {
    let steps = ['before', 'build', 'deploy', 'outline', 'publish', 'version'];
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
    this._params = this.parse(argv);

    if (this._params.step && this._params.step.length > 0) {
      let fn = null;
      switch (this._params.step) {
        case 'before':
          fn = this.before; break;
        case 'build':
          fn = this.build; break;
        case 'outline':
          fn = this.outline; break;
        case 'deploy':
          fn = this.deploy; break;
        case 'publish':
          fn = this.publish; break;
        case 'version':
          fn = this.version; break;
      }

      if (!fn) {
        console.log(chalk.red('Unkown step: %s'), this._params.step);
        process.exit(1);
      }

      global.config.debug && console.log('ci.step', this._params.step)

      return fn.call(this)
        .catch(e => console.log(e))
    }

    return this.before()
      .then(this.build.bind(this))
      // .then(this.version.bind(this))
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
      let p = global.config.s3 === true ? this._deploy.notOnS3.bind(this._deploy) : Promise.resolve;
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
    return (this._params.step && this._params.step.length > 0) || this._version.hasChanges ? 
           this._deploy.run() : 
           Promise.resolve()
  }

  outline(){
    return new Promise((resolve, reject) => {
      this._fs.prepare()
      .then(this._font.create.bind(this._font))
      .then(() => resolve)
      .catch((e) => {
        console.log(e)
        reject()
      })
    })
  }

  publish() {
    return (this._params.step && this._params.step.length > 0) || this._version.hasChanges ? 
           this._publish.run() : 
           Promise.resolve()
  }

  version() {
    return this._version.run()
  }
}

const ci = new CI();
ci.run(process.argv.slice(2));
