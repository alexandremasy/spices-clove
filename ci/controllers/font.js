const ora = require('ora')
const fs = require('fs')
const path = require('path')
const Icon = require('../utils/icon')
const execute = require('../utils/execute')

const outline = require('svg-outline-stroke')
const outlineStroke = require('svg-outline-stroke')

module.exports = class FontController{
  constructor(){
    this.config = global.config
    this._icons = null
    this._unicodes = {}
    this._current = 0;

    this._spinner = ora()
  }
  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * @property {Array} icons The list of available icons
   */
  get icons() {
    return this._icons
  }
  set icons(value) {
    this._icons = value
  }

  /**
   * @property {Path} iconPath
   * @readonly
   */
  get outputPath() {
    return path.resolve(global.config.output)
  }

  ////////////////////////////////////////////////////////////////////////////////////


  /**
   * Create the iconfont
   */
  create(){
    return new Promise((resolve, reject) => {
      this.prepare()
      .then(this.outline.bind(this))
      .then(this.iconfontSVG.bind(this))
      .then(this.iconfontTTF.bind(this))
      .then(() => {
        return resolve()
      })
      .catch(e => reject(e))
    })
  }
  

  /**
   * Find the existing icons
   * 
   * @temp
   * @private
   */
  prepare(){
    return new Promise((resolve, reject) => {
      this._spinner.start('iconfont::prepare')
      let p = path.resolve(this.outputPath, 'icons')
      this._icons = fs.readdirSync(p).map(file => {
        let ret = new Icon({
          name: file.substring(0, file.indexOf('.svg'))
        })
  
        ret.output = path.resolve(p, file)
        return ret
      });

      this._spinner.succeed()
      return resolve()
    })
  }

  /**
   * Create an outline version of the existing icon
   * 
   * @return {Promise}
   */
  outline(){
    return new Promise((resolve, reject) => {
      this._spinner.start('iconfont::outline')
  
      Promise.all(this._icons.map(i => this.outlineIcon(i)))
      .then( this.fixOutline.bind(this) )
      .then(() => {
        this._spinner.succeed()
        return resolve()
      })
      .catch(e => {
        this._spinner.fail()
        return reject()
      })
    })

  }

  /**
   * Create the outline version of the given icon
   * 
   * @param {*} icon 
   */
  outlineIcon(icon){
    return new Promise((resolve, reject) => {
      let data = fs.readFileSync(icon.output, 'utf-8')

      outlineStroke(data, {
        optCurve: false,
        step: 4,
        round: 0,
        centerHorizontally: true,
        fixedWidth: true, 
        color: 'black'
      })
      .then(data => {
        const image = path.resolve(this.outputPath, 'outlined', `${icon.name}.svg`)
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
      this._spinner.start('iconfont::svg')
      let _spinner = this._spinner
      let unicode = 57345
      const output = path.resolve(this.outputPath, 'iconfont', 'spices-icons.svg')
      
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
      stream.pipe(fs.createWriteStream(output))
        .on('finish', function () {
          _spinner.succeed()
          return resolve()
        })
        .on('error', function (err) {
          _spinner.fail()
          console.log(err);
          reject(err)
        })

      this._icons.forEach(i => {
        unicode++
        let s = fs.createReadStream(i.output)
        s.metadata = {
          unicode: [String.fromCharCode(unicode)],
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
      this._spinner.start('iconfont::ttf')
      const svg2ttf = require('svg2ttf')
      const input = path.resolve(this.outputPath, 'iconfont', 'spices-icons.svg')
      const output = path.resolve(this.outputPath, 'iconfont', 'spices-icons.ttf')

      let ttf = svg2ttf(fs.readFileSync(input, 'utf-8'), {})
      fs.writeFileSync(output, new Buffer(ttf.buffer))

      this._spinner.succeed()
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

  }


  /**
   * Create the woff font
   * 
   * @returns {Promise}
   * @see ttf2woff2 https://www.npmjs.com/package/ttf2woff2
   */
  iconfontWoff2(){

  }

  css(){

  }

  updateTagsUnicode(){

  }
}