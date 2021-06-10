const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const writeFile= util.promisify(fs.writeFile)
const Font = require('../models/font')

module.exports = class WebfontController{
  
  /**
   * Create the svg font
   * 
   * @param {Object} options
   * @param {Font} options.font The font to convert
   * @see svgicons2svgfont https://github.com/nfroidure/svgicons2svgfont
   */
  static svg({ font }){
    return new Promise((resolve, reject) => {
      const SVGIcons2SVGFont = require('svgicons2svgfont');
      const fontStream = new SVGIcons2SVGFont({
        // ascent: 986.5,
        // descent: 100,
        fontHeight: 1000,
        fontName: font.name,
        fontId: font.name,
        fontWeight: 400,
        log: () => { },
        normalize: false,
      });

      // Add the icons
      font.glyphs.forEach(glyph => {
        let u = `\\u${glyph.unicodeString.toUpperCase()}`
        let g = fs.createReadStream(glyph.system)

        console.log(glyph.unicodeString, u)
        g.metadata = {
          name: glyph.name,
          // unicode: [ glyph.unicodeString ],
          // unicode: ['\uE001'],
          unicode: [ glyph.unicodeChar ]
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