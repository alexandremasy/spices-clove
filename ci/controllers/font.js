const ora = require('ora')
const fs = require('fs')
const path = require('path')
const util = require('util')
const Icon = require('../utils/icon')
const readFile = util.promisify(fs.readFile)
const writeFile= util.promisify(fs.writeFile)
const { basil } = require('@spices/basil')
const { scale } = require('scale-that-svg')

const outlineStroke = require('svg-outline-stroke')

module.exports = class FontController{
  constructor(){
    this.config = global.config
    this._unicodes = {}
    this._current = 0;

    this._spinner = ora()
  }
  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Create the iconfont
   */
  create(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Creating the iconfont')

      this.outline()
      // .then(this.iconfontSVG.bind(this))
      // .then(this.iconfontTTF.bind(this))
      // .then(this.iconfontWoff.bind(this))
      // .then(this.iconfontWoff2.bind(this))
      .then(() => {
        this._spinner.succeed('Creating the iconfont')
        return resolve()
      })
      .catch(e => reject(e))
    })
  }

  /**
   * Create an outline version of the existing icon
   * 
   * @return {Promise}
   */
  outline(){
    return new Promise((resolve, reject) => {
      this._spinner.text = 'Creating the iconfont [Outline]'

      // Promise.all(global.config.list.map(i => this.outlineIcon(i)))
      basil.sequence(global.config.list.map(i => this.outlineIcon.bind(this, i)))
      // .then( this.fixOutline.bind(this) )
      .then(() => {
        console.log('outine end')
        return resolve()
      })
      .catch(e => reject(e))
    })
  }

  /**
   * Create the outline version of the given icon
   * 
   * @param {*} icon 
   */
  outlineIcon(icon){
    return new Promise((resolve, reject) => {

      icon.data ? Promise.resolve(icon.data) : readFile(icon.output, 'utf-8')
      .then(data => scale(data, { scale: 100 }))
      .then(data => {
        return outlineStroke(data, {
          optCurve: true,
          step: 4,
          centerHorizontally: true,
          fixedWidth: true, 
          color: 'black'
        })}
      )
      .then(data => {
        const image = path.resolve(global.config.outlined, `${icon.name}.svg`)
        return writeFile(image, data)
      })
      .then(() => {
        this._current++
        this._spinner.text = `Creating the iconfont [Outline] ${this._current} / ${global.config.list.length}`

        return resolve()
      })
      .catch(e => {
        console.log('------ Error -------')
        console.log(icon.path)
        console.log('issue with', e)
        return reject()
      })
    })
  }

  /**
   * Fix the svg outline path direction
   * 
   * @returns {Promise}
   */
  fixOutline(){
    return new Promise((resolve, reject) => {
      const execute = require('../utils/execute')

      let script = path.resolve(__dirname, '../outline.py')
      let command = `fontforge -lang=py -script ${script}`
      execute(command, {verbose: false})
      .then(() => {
        return resolve()
      })
      .catch(e => {
        console.log('Error')
        console.log(e)
      })
    })
  }
  
  /**
   * Create the svg font
   * 
   * @see svgicons2svgfont https://github.com/nfroidure/svgicons2svgfont
   */
  iconfontSVG(){
    return new Promise((resolve, reject) => {
      this._spinner.text = 'Creating the iconfont [SVG]'

      /**
       * Unicode Private Use Area start.
       * https://en.wikipedia.org/wiki/Private_Use_Areas
       */
      let startUnicode = 0xea01;
      let unicode = startUnicode
      
      const SVGIcons2SVGFont = require('svgicons2svgfont');
      const fontStream = new SVGIcons2SVGFont({
        // ascent: 986.5,
        // descent: 100,
        fontHeight: 1000,
        fontName: 'spices-icons',
        log: () => { },
        normalize: false,
      });

      // Add the icons
      global.config.list.forEach(i => {
        unicode++

        let url = path.resolve(global.config.outlined, `${i.name}.svg`)
        let glyph = fs.createReadStream(url)
        i.unicode = String.fromCharCode(unicode)
        glyph.metadata = {
          unicode: [i.unicode],
          name: i.name
        }
        fontStream.write(glyph)
      })

      fontStream.pipe(fs.createWriteStream(global.config.iconfont_svg))
        .on('finish', function () {
          return resolve()
        })
        .on('error', function (err) {
          return reject(err)
        })

      fontStream.end()
    })
  }

  /**
   * Create the ttf font
   * 
   * @returns {Promise}
   * @see svg2ttf https://github.com/fontello/svg2ttf
   */
  iconfontTTF(){
    return new Promise((resolve, reject) => {
      this._spinner.text = 'Creating the iconfont [TTF]'

      const svg2ttf = require('svg2ttf')
      const input = global.config.iconfont_svg
      const output = global.config.iconfont_ttf

      readFile(input, 'utf-8')
      .then(ttf => {
        ttf = svg2ttf(ttf, {
          copyright: 'Alexandre Masy',
          version: '2.0'
        })
        ttf = Buffer.from(ttf.buffer);

        return writeFile(output, ttf)
      })
      .then((err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      })

      return resolve()
    })
  }

  /**
   * Create the woff font
   * 
   * @returns {Promise}
   * @see ttf2woff https://github.com/fontello/ttf2woff
   */
  iconfontWoff(){
    return new Promise((resolve, reject) => {
      this._spinner.text = 'Creating the iconfont [WOFF]'
      const ttf2woff = require('ttf2woff')
      const input = global.config.iconfont_ttf
      const output = global.config.iconfont_woff

      let woff = ttf2woff(fs.readFileSync(input))
      fs.writeFileSync(output, woff.buffer)
      
      return resolve()
    })
  }

  /**
   * Create the woff font
   * 
   * @returns {Promise}
   * @see ttf2woff2 https://github.com/nfroidure/ttf2woff2
   */
  iconfontWoff2(){
    return new Promise((resolve, reject) => {
      this._spinner.text = 'Creating the iconfont [WOFF2]'

      const ttf2woff2 = require('ttf2woff2')
      const input = global.config.iconfont_ttf
      const output = global.config.iconfont_woff2

      let woff = ttf2woff2(fs.readFileSync(input))
      fs.writeFileSync(output, woff)

      return resolve()
    })
  }
}