const ora = require('ora')
const path = require('path')
const fs = require('fs')
const util = require('util')

module.exports = class TemplatesController{
  constructor(){
    this._icons = null
    this._spinner = ora();
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
   * @property {Number} nIcons - Count the number of icons available
   */
  get nIcons() {
    return this._icons.length
  }

  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Create the icons variable list
   * 
   * @returns {Promise}
   */
  scss() {
    return new Promise((resolve, reject) => {
      this._spinner.start('Creating the scss')

      let icons = this.icons.map(i => i.name)
      let data = ''
      data += `$spices-icons-path: '${global.config.sprite_public}';`
      data += `\n$spices-icons-version: '${global.config.next}';`
      data += `\n`
      data += `\n$spices-icons: (\n\t${icons.join(', \n\t')}\n);`

      fs.writeFileSync(global.config.scss, data)

      this._spinner.succeed()
      resolve()
    })
  }

  /**
   * Create the svg sprite
   * 
   * @returns {Promise}
   */
  sprite() {
    return new Promise((resolve, reject) => {
      this._spinner.start('Creating the sprite')

      const readFile = util.promisify(fs.readFile)
      
      let data = ``
      Promise.all(this.icons.map(i => {
        return new Promise((resolve, reject) => {
          let image = path.resolve(global.config.icons, `${i.name}.svg`)
          readFile(image, 'utf8')
          .then(content => {
            content = content.replace(/<svg[^>]+>/g, '')
                             .replace(/<\/svg>/g, '')
                             .replace(/\n+/g, '')
                             .replace(/>\s+</g, '><')
                             .trim();

            let ret = `<g id="${i.name}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</g>`
            resolve(ret)
          })
        })
      }))
      .then(results => {
        data = results.join('\n')
        data = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <defs><style>symbol{	display: none; } symbol:target {	display: inline; }</style></defs>
          ${data}
        </svg>`;
        fs.writeFileSync(global.config.sprite, data);
  
        this._spinner.succeed()
        return resolve()
      })
    })
  }

  /**
   * Generate the list of available icons
   */
  list(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Create the json list')

      let data = this._icons.map(i => {
        return {
          category: i.category,
          name: i.name,
          unicode: i.unicode,
          src: path.resolve(global.config.s3_url, 'icons/')
        }
      })
    })
  }
}