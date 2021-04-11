const Listr = require('listr');
const VerboseRenderer = require('listr-verbose-renderer');

const Font = require('./models/font')
const FontController = require('./controllers/font')

class CI{
  run(){
    const fonts = [
      new Font({ name: 'pepper-regular', figmaId: 'U2TtGONui0MxqNh6fo0QVX' })
    ]

    const tasks = new Listr(fonts.map(f => {
      return {
        title: `Generating ${f.name}`,
        task: this.generateFont.bind(this, f)
      }
    }), {
      renderer: VerboseRenderer
    })
    tasks.run()
    .catch(e => {
      console.log(e)
    })
  }

  /**
   * Generate a font
   * @param {Font} font 
   * @returns 
   */
  generateFont(font){
    const controller = new FontController(font)
    return new Listr([
      {
        title: 'Find out the manifest state',
        task: (ctx, task) => controller.load()
      },
      {
        title: 'Syncing data from Figma',
        task: (ctx, task) => controller.syncWithFigma({ctx, task})
      },
      {
        title: 'Gathering the icons',
        task: (ctx, task) => controller.fetch({ctx, task})
      },
      {
        title: 'Generating the webfonts',
        task: (ctx, task) => controller.webfont({ctx, task})
      }
    ])
  }
}

const ci = new CI();
ci.run();