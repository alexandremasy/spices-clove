const ora = require('ora')
const path = require('path')
const fs = require('fs')
const util = require('util')

module.exports = class TemplatesController{
  constructor(){
    this._config = global.config;
    this._icons = null

    this._spinner = ora();
  }
  ////////////////////////////////////////////////////////////////////////////////////

  get demoPath(){
    return path.resolve(this.outputPath, './demo.vue')
  }

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

  /**
   * @property {Path} iconPath
   * @readonly
   */
  get outputPath() {
    return path.resolve(this._config.output)
  }

  get scssPath(){
    return path.resolve(this.outputPath, './spices-icons.scss')
  }

  get spritePath(){
    return path.resolve(this.outputPath, './spices-icons.svg')
  }

  get vueIconsPath(){
    return path.resolve(this.outputPath, 'spices-icons.vue')
  }

  ////////////////////////////////////////////////////////////////////////////////////

  demo(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Creating the demo page')

      let data = this.icons.map(i => {
        return `<svg class="icon"><use xlink:href="#${i.name}"></use></svg>`
      })
      data = `<template>\n\t<div>\n\t\t${data.join('\n\t\t')}</div></template>`

      fs.writeFileSync(this.demoPath, data)
      this._spinner.succeed();
      return resolve()
    })
  }

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
      data += `$spices-icon-path: '//cdn.sayl.cloud/spices/spices-icons/2.0.0';`
      data += `\n$spices-icon-version: '${this._config.next}';`
      data += `\n`
      data += `\n$spices-icon-icons: (\n\t${icons.join(', \n\t')}\n);`

      fs.writeFileSync(this.scssPath, data)

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
          let image = path.resolve(this.outputPath, 'icons', `${i.name}.svg`)
          readFile(image, 'utf8')
          .then(content => {
            content = content.replace(/<svg[^>]+>/g, '')
                             .replace(/<\/svg>/g, '')
                             .replace(/\n+/g, '')
                             .replace(/>\s+</g, '><')
                             .trim();

            let ret = `<symbol id="${i.name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</symbol>`
            resolve(ret)
          })
        })
      }))
      .then(results => {
        data = results.join('\n')
        data = `<svg xmlns="http://www.w3.org/2000/svg"><defs>${data}</defs></svg>`;
        fs.writeFileSync(this.spritePath, data);
  
        this._spinner.succeed()
        return resolve()
      })
    })
  }

  vue() {
    return new Promise((resolve, reject) => {
      this._spinner.start('Creating the vue components')
      let sprite = fs.readFileSync(this.spritePath, 'utf8')

      let data = `<template>
  ${sprite}
</template>

<script>
// 
// Warning: Auto-generated file please do not edit directly
// 
export default {
  name: 'SpicesIcons'
}
</script>
      `

      fs.writeFileSync(this.vueIconsPath, data)
      this._spinner.succeed();
      return resolve()
    })
  }
}