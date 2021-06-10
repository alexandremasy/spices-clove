/**
 * @class
 */
module.exports = class FigmaController{

  /**
   * Compute the list of images to download
   * 
   * @param {Array} icons The list of icons
   * @param {String} figmaId The figma file id
   * @returns {Promise}
   */
  static computeImageList(client, ctx, font) {
    return new Promise((resolve, reject) => {
      let icons = ctx.icons
      let ids = icons.map(i => i.id).join(',')
      client.get(`/images/${font.figmaId}?ids=${ids}&format=svg`)
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
  static fetch(client, ctx, font){
    return new Promise((resolve, reject) => {
      client.get(`/files/${font.figmaId}`)
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
  static findIcons(client, ctx, font){
    return new Promise((resolve, reject) => {
      let ret = []
      let names = []
  
      let pages = ctx.document.children;
      pages.filter(p => !p.name.includes('_'))
      .forEach(p => p.children.forEach(f => {
        if (f.type === 'COMPONENT'){
          // Prevent duplicates
          if (names.includes(f.name)){
            console.warn(`ERR: Duplicate icon "${f.name}"`)
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