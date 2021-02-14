const Figma = require('../api/figma')
const ora = require('ora')

module.exports = class FigmaController{
  constructor(config) {
    this._config = config
    this._spinner = ora()

    this._document = null
    this._icons = []
  }
  ////////////////////////////////////////////////////////////////////////////////////

  get client(){
    return Figma(this._config.figmaPersonalToken)
  }

  /**
   * Set the config
   * 
   * @property {Object} config
   */
  set config(value){
    this._config = value
  }

  /**
   * @property {FigmaDocument} document The figma document
   */
  get document(){
    return this._document
  }

  /**
   * @property {Array} icons The list of existing icons
   */
  get icons(){
    return this._icons
  }

  ////////////////////////////////////////////////////////////////////////////////////

  /**
   * Compute the list of images to download
   * 
   * @returns {Promise}
   */
  computeImageList() {
    return new Promise((resolve, reject) => {
      let ids = this.icons.map(i => i.id).join(',')
      this.client.get(`/images/${this._config.fileId}?ids=${ids}&format=svg`)
        .then((res) => {
          let images = res.data.images
          this._icons.forEach(i => i.path = images[i.id])

          return resolve()
        })
    })
  }

  /**
   * Fetch the figma file
   */
  fetch(){
    return new Promise((resolve, reject) => {
      this.client.get(`/files/${this._config.fileId}`)
      .then((res) => {
        this._document = res.data.document
        resolve()
      })
      .catch((err) => reject(err))
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
  
      let pages = this._document.children;
      pages.filter(p => !p.name.includes('_'))
      .map(p => p.children.forEach(f => {
        ret.push({ id: f.id, name: f.name })
      }))

      this._icons = ret

      return resolve();
    })
  }  

  /**
   * Run the Figma process
   * 
   * @returns {Promise}
   */
  run(){
    return new Promise((resolve, reject) => {
      this._spinner.start('Computing the list of icons')
      this.fetch()
      .then(this.findIcons.bind(this))
      .then(this.computeImageList.bind(this))
      .then(() => {
        this._spinner.succeed(`${this.icons.length + 1} icon(s) found`)
        return resolve()
      })
      .catch(e => {
        this._spinner.fail()
        return reject(e)
      })
    })
  }
}