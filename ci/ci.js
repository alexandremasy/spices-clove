const Listr = require('listr');
const VerboseRenderer = require('listr-verbose-renderer');

const Font = require('./models/font')
const FontController = require('./controllers/font');
const FontInit = require('./stages/init');
const FontFigma = require('./stages/figma');
const FontFetch = require('./stages/fetch');

class CI{
  run(){
    const fonts = [
      new Font({ name: 'spices-clove-regular', figmaId: 'U2TtGONui0MxqNh6fo0QVX' })
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
        title: 'Bootstraping the env',
        task: (ctx, task) => FontInit.exec({ ctx, font, task })
      },
      {
        title: 'Syncing data from Figma',
        task: (ctx, task) => FontFigma.exec({ ctx, font, task })
      },
      {
        title: 'Gathering the icons',
        task: (ctx, task) => FontFetch.exec({ctx, font, task})
      },
      {
        title: 'Generating the webfonts',
        task: (ctx, task) => controller.webfont({ctx, task})
      },
      {
        title: 'Publishing the new version',
        task: (ctx, task) => controller.publish({ctx, task})
      }
    ])
  }
}

const ci = new CI();
ci.run();