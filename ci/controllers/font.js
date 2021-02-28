const ora = require('ora')
const fs = require('fs')
const path = require('path')
const util = require('util')
const Icon = require('../utils/icon')
const readFile = util.promisify(fs.readFile)

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
      .then(this.iconfontSVG.bind(this))
      .then(this.iconfontTTF.bind(this))
      .then(this.iconfontWoff.bind(this))
      .then(this.iconfontWoff2.bind(this))
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

      Promise.all(global.config.list.map(i => this.outlineIcon(i)))
      .then( this.fixOutline.bind(this) )
      .then(() => {
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
      readFile(icon.output, 'utf-8')
      .then(data => outlineStroke(data, {
        optCurve: false,
        step: 4,
        round: 0,
        centerHorizontally: true,
        fixedWidth: true, 
        color: 'black'
      }))
      .then(data => {
        const image = path.resolve(global.config.outlined, `${icon.name}.svg`)
        fs.writeFileSync(image, data)
        this._current++
        return resolve()
      })
      .catch(e => {
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

      let unicode = 57345
      
      const SVGIcons2SVGFontStream = require('svgicons2svgfont');
      const stream = new SVGIcons2SVGFontStream({
        // ascent: 986.5,
        // descent: 100,
        fontHeight: 1000,
        fontName:'spices-icons',
        log: () => {},
        normalize: true,
        prependUnicode: true
      })
      stream.pipe(fs.createWriteStream(global.config.iconfont_svg))
        .on('finish', function () {
          return resolve()
        })
        .on('error', function (err) {
          return reject(err)
        })

      global.config.list.forEach(i => {
        unicode++
        let s = fs.createReadStream(i.output)
        i.unicode = String.fromCharCode(unicode)
        s.metadata = {
          unicode: [i.unicode],
          name: i.name
        }
        stream.write(s)
      })

      stream.end()
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

      let ttf = svg2ttf(fs.readFileSync(input, 'utf-8'), {})
      fs.writeFileSync(output, ttf.buffer)

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