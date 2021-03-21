const Figma = require('../api/figma')
const ora = require('ora')
const Icon = require('../utils/icon')
const { default: chalk } = require('chalk')

module.exports = class FigmaController{
  constructor() {
    this._spinner = ora()
    this._document = null
  }
  ////////////////////////////////////////////////////////////////////////////////////

  get client(){
    return Figma(global.config.figma_personal_token)
  }

  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Compute the list of images to download
   * 
   * @returns {Promise}
   */
  computeImageList() {
    return new Promise((resolve, reject) => {
      let ids = global.config.list.map(i => i.id).join(',')
      this.client.get(`/images/${global.config.figma_file_id}?ids=${ids}&format=svg`)
        .then((res) => {
          let images = res.data.images
          global.config.list.forEach(i => i.origin = images[i.id])

          return resolve()
        })
    })
  }

  /**
   * Fetch the figma file
   */
  fetch(){
    return new Promise((resolve, reject) => {
      this.client.get(`/files/${global.config.figma_file_id}`)
      .then((res) => {
        this._document = res.data.document
        resolve()
      })
      .catch((err) => {
        reject()
      })
    })
  }

  /**
   * Browse the whole figma document and pages for icons
   * 
   * @returns {Promise}
   */
  findIcons(){
    return new Promise((resolve, reject) => {
      let ret = []
      let names = []
  
      let pages = this._document.children;
      pages.filter(p => !p.name.includes('_'))
      .forEach(p => p.children.forEach(f => {
        if (f.type === 'COMPONENT'){
          // Prevent duplicates
          if (names.includes(f.name)){
            console.log();
            console.warn(chalk.red(`ERR: Duplicate icon "${f.name}"`))
            process.exit();
          }
          else{
            names.push(f.name);
            ret.push( new Icon({ id: f.id, name: f.name, category: p.name }) )
          }
        }
      }))

      ret.sort((a, b) => ('' + a.name).localeCompare(b.name))
      global.config.list = ret

      return resolve();
    })
  }  

  /**
   * Get the list of icons from Figma
   * - Fetch the Figma File
   * - Go through all the layer in the hunt for layers
   * - Get all the found layer download links
   * 
   * @returns {Promise}
   */
  getIcons(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Computing the list of icons')
      this.fetch()
      .then(this.findIcons.bind(this))
      .then(this.computeImageList.bind(this))
      .then(() => {
        this._spinner.succeed(`${global.config.list.length} icon(s) found`)
        return resolve()
      })
      .catch(e => {
        this._spinner.fail('Figma API might have a glitch or two')
        return reject(e)
      })
    })
  }
}