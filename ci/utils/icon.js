module.exports = class Icon{
  
  /**
   * @constructor
   * @param {Object} options 
   * @param {String} options.id 
   * @param {String} options.name 
   */
  constructor({ category, data = null, id, name, origin = null, output = null, unicode = 0 }){
    this._category = category
    this._id = id
    this._name = name

    this._data = data
    this._origin = origin
    this._output = output

    this._unicode = unicode
  }

  ////////////////////////////////////////

  /**
   * @property {String} category The icon category
   */
  get category(){
    return this._category
  }
  
  /**
   * @property {String} data The svg content string
   */
  set data(value){
    this._data = value
  }
  get data(){
    return this._data
  }

  /**
   * @property {String} id The icon id - Comes from the Figma API
   * @readonly
   */
  get id(){
    return this._id
  }
  
  /**
   * @property {String} name The icon name - Comes from the Figma layer name
   * @readonly
   */
  get name(){
    return this._name
  }

  /**
   * @property {String} output The local path to the downloaded file
   */
  set output(value){
    this._output = value
  }
  get output(){
    return this._output
  }
  
  /**
   * @property {String} origin The path to download the file
   */
  set origin(value){
    this._origin = value
  }
  
  get origin(){
    return this._origin
  }

  /**
   * @property {Number} unicode The unicode value (iconfont)
   */
  set unicode(value){
    this._unicode = value
  }
  get unicode(){
    return this._unicode
  }

  ////////////////////////////////////////
}