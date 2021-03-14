const ora = require('ora')
const path = require('path')
const fs = require('fs')
const util = require('util')

module.exports = class TemplatesController{
  constructor(){
    this._spinner = ora();
  }
  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * @property {Number} nIcons - Count the number of icons available
   */
  get nIcons() {
    return global.config.list.length
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

      let icons = global.config.list.map(i => `${i.name}: "\\${i.unicodeString}"`)
      let data = ''
      data += `$spices-icons-path: '${global.config.sprite_public}';`
      // data += `\n$spices-icons-iconfont-root: '${global.config.s3_url}iconfont/';`
      data += `\n$spices-icons-iconfont-root: '/iconfont/';`
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
      Promise.all(global.config.list.map(i => {
        return new Promise((resolve, reject) => {
          let image = path.resolve(global.config.icons, `${i.name}.svg`)
          readFile(image, 'utf8')
          .then(content => {
            content = content.replace(/<svg[^>]+>/g, '')
                             .replace(/<\/svg>/g, '')
                             .replace(/\n+/g, '')
                             .replace(/>\s+</g, '><')
                             .trim();

            let ret = `<symbol id="${i.name}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</symbol>`
            resolve(ret)
          })
        })
      }))
      .then(results => {
        data = results.join('')
        data = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>${data}</defs></svg>`;
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
      this._spinner.start('Create the json')

      let data = global.config.list.map(i => {
        return {
          category: i.category,
          name: i.name,
          unicode: i.unicodeString,
          path: [global.config.s3_url, 'icons', '/', i.name, '.svg'].join('')
        }
      })

      fs.writeFileSync(global.config.json, JSON.stringify(data))
      this._spinner.succeed()
      return resolve()
    })
  }
}