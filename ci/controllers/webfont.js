const { basil } = require('@spices/basil')
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const writeFile= util.promisify(fs.writeFile)
const Font = require('../models/font')
const FontType = require('../models/font-type')

module.exports = class WebfontController{

  /**
   * Create the iconfont
   * 
   * @param {Object} options
   * @param {Font} options.font The font to convert
   * @returns {Promise}
   */
  static create({ font }){
    return new Promise((resolve, reject) => {
      let args = { font }
      let tasks = font.types
        .filter(t => FontType.ALL.includes(t.type))
        .map(t => {
          let ret = Promise.resolve.bind(Promise, args)
          if (t.type === FontType.TTF){
            ret = WebfontController.ttf.bind(this, args)
          }

          if (t.type === FontType.WOFF){
            ret = this.woff.bind(this, args)
          }

          if (t.type == FontType.WOFF2){
            ret = WebfontController.woff2.bind(this, args)
          }

          return ret
        })
      
      if (tasks.length > 0){
        tasks.unshift(WebfontController.svg.bind(this, args))
      }

      basil.sequence(tasks, 1)
      .then(() => {
        console.log('done')
      })
      .catch(e => console.error(e))
    })
  }
  
  /**
   * Create the svg font
   * 
   * @param {Object} options
   * @param {Font} options.font The font to convert
   * @see svgicons2svgfont https://github.com/nfroidure/svgicons2svgfont
   */
  static svg({ font }){
    return new Promise((resolve, reject) => {
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
        fontName: font.name,
        log: () => { },
        normalize: false,
      });

      // Add the icons
      font.glyphs.forEach(glyph => {
        unicode++

        let g = fs.createReadStream(glyph.system)
        g.metadata = {
          unicode: [ glyph.unicode ],
          name: glyph.name
        }
        fontStream.write(g)
      })

      fontStream.pipe(fs.createWriteStream(font.svg.system))
        .on('finish', function () {
          setTimeout(() => {
            resolve()
          }, 300);
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
   * @param {Object} options
   * @param {Font} options.font The font to convert
   * @returns {Promise}
   * @see svg2ttf https://github.com/fontello/svg2ttf
   */
  static ttf({ font }){
    return new Promise((resolve, reject) => {
      const svg2ttf = require('svg2ttf')
      const input = font.svg.system
      const output = font.ttf.system

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

        setTimeout(() => {
          resolve()
        }, 300);
      })
    })
  }

  /**
   * Create the woff font
   * 
   * @param {Object} options
   * @param {Font} options.font The font to convert
   * @returns {Promise}
   * @see ttf2woff https://github.com/fontello/ttf2woff
   */
  static woff({ font }){
    return new Promise((resolve, reject) => {
      const ttf2woff = require('ttf2woff')
      const input = font.ttf.system
      const output = font.woff.system

      let woff = ttf2woff(fs.readFileSync(input))
      fs.writeFileSync(output, woff.buffer)
      
      setTimeout(() => {
        resolve()
      }, 300);
    })
  }

  /**
   * Create the woff font for the given font
   * 
   * @param {Object} options
   * @param {Font} options.font The font to convert
   * @returns {Promise}
   * @see ttf2woff2 https://github.com/nfroidure/ttf2woff2
   */
  static woff2({font}){
    return new Promise((resolve, reject) => {
      const ttf2woff2 = require('ttf2woff2')
      const input = font.ttf.system
      const output = font.woff2.system

      let woff = ttf2woff2(fs.readFileSync(input))
      fs.writeFileSync(output, woff)

      return resolve()
    })
  }
}