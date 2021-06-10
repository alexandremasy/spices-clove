require('dotenv').config()

const Listr = require('listr');
const VerboseRenderer = require('listr-verbose-renderer');
const UpdaterRenderer = require('listr-update-renderer');

const Font = require('./models/font')
const FontInit = require('./stages/init');
const FontFigma = require('./stages/figma');
const FontFetch = require('./stages/fetch');
const FontWeb = require('./stages/webfont');
const FontPublish = require('./stages/publish');

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
      renderer: UpdaterRenderer,
      collapse: false,
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
        task: (ctx, task) => FontWeb.exec({ctx, font, task})
      },
      {
        title: 'Publishing the new version',
        task: (ctx, task) => FontPublish.exec({ctx, font, task})
      }
    ])
  }
}

const ci = new CI();
ci.run();
