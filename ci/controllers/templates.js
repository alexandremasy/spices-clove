const Icon = require('../utils/icon')
const ora = require('ora')
const path = require('path')
const fs = require('fs')
const util = require('util')
const svgstore = require('svgstore')
const { optimize } = require('svgo')

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

  /**
   * @property {Object} svgoConfig
   * @readonly
   */
  get svgoConfig() {
    return {
      plugins: [
        'cleanupAttrs',
        'removeDoctype',
        'removeXMLProcInst',
        'removeComments',
        'removeMetadata',
        'removeTitle',
        'removeDesc',
        // 'removeUselessDefs',
        'removeEditorsNSData',
        'removeEmptyAttrs',
        'removeHiddenElems',
        'removeEmptyText',
        'removeEmptyContainers',
        'removeViewBox',
        'cleanupEnableBackground',
        'convertStyleToAttrs',
        'convertColors',
        'convertPathData',
        'convertTransform',
        'removeUnknownsAndDefaults',
        'removeNonInheritableGroupAttrs',
        'removeUselessStrokeAndFill',
        'removeUnusedNS',
        'cleanupIDs',
        'cleanupNumericValues',
        'moveElemsAttrsToGroup',
        'moveGroupAttrsToElems',
        'collapseGroups',
        'removeRasterImages',
        'mergePaths',
        'convertShapeToPath',
        'sortAttrs',
        'removeDimensions',
        { name: 'removeAttrs', attrs: '(stroke|fill)' },
      ]
    }
  }

  get vueIconsPath(){
    return path.resolve(this.outputPath, 'spices-icons.vue')
  }

  ////////////////////////////////////////////////////////////////////////////////////

  demo(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Creat the demo page')

      let data = this.icons.map(i => {
        return `<svg class="icon"><use xlink:href="#${i.name}"></use></svg>`
      })
      data = `<template>\n\t<div>\n\t\t${data.join('\n\t\t')}</div>`

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
      data += `\n$spices-icon-version: '2.0.0';`
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

      let s = svgstore()
      this.icons.forEach(({ name }) => {
        let image = path.resolve(this.outputPath, 'icons', `${name}.svg`)
        s.add(name, fs.readFileSync(image, 'utf8'))
      })

      let result = optimize(s.toString(), {
        path: this.spritePath,
        ...this.svgoConfig
      })

      fs.writeFileSync(this.spritePath, result.data);

      this._spinner.succeed()
      return resolve()
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