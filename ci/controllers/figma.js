const chalk = require('chalk')
const Figma = require('../api/figma')
const config = require('../utils/config')

/**
 * @class
 */
module.exports = class FigmaController{

  /**
   * @property {Figma} client The figma api client
   * @readonly
   */
  get client(){
    return Figma(config.figma_personal_token)
  }

  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Compute the list of images to download
   * 
   * @param {Array} icons The list of icons
   * @param {String} figmaId The figma file id
   * @returns {Promise}
   */
  computeImageList({figmaId, icons}) {
    return new Promise((resolve, reject) => {
      let ids = icons.map(i => i.id).join(',')
      this.client.get(`/images/${figmaId}?ids=${ids}&format=svg`)
      .then((res) => {
        let images = res.data.images
        icons.forEach(i => i.source = images[i.id])

        return resolve(icons)
      })
      .catch(e => {
        console.log('error with the api from Figma')
        console.log(e.response);
      })
    })
  }

  /**
   * Fetch the figma file
   * 
   * @param {Object} ctx Context
   * @param {String} ctx.figmaId The figma file id
   * @returns {Promise}
   */
  fetch(ctx){
    return new Promise((resolve, reject) => {
      this.client.get(`/files/${ctx.figmaId}`)
      .then((res) => {
        ctx.document = res.data.document
        resolve(ctx)
      })
      .catch((err) => reject())
    })
  }

  /**
   * Browse the whole figma document and pages for icons
   * 
   * @param {Object} ctx The context
   * @param {Object} ctx.document The figma document ast
   * @returns {Promise}
   */
  findIcons(ctx){
    return new Promise((resolve, reject) => {
      let ret = []
      let names = []
  
      let pages = ctx.document.children;
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
            ret.push({ 
              category: p.name, 
              id: f.id, 
              name: f.name, 
            })
          }
        }
      }))

      ret.sort((a, b) => ('' + a.name).localeCompare(b.name))
      ctx.icons = ret

      return resolve(ctx)
    })
  }  

  /**
   * Get the list of icons from Figma
   * - Fetch the Figma File
   * - Go through all the layer in the hunt for layers
   * - Get all the found layer download links
   * 
   * @param {String} figmaId The figma file id
   * @returns {Promise}
   */
  getIcons(figmaId){
    return new Promise((resolve, reject) => {
    this.fetch({ figmaId })
      .then(this.findIcons.bind(this))
      .then(this.computeImageList.bind(this))
      .then(icons => resolve(icons))
      .catch(e => reject(e))
    })
  }
}