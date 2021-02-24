module.exports = class Icon{
  
  /**
   * @constructor
   * @param {Object} options 
   * @param {String} options.id 
   * @param {String} options.name 
   */
  constructor({ id, name }){
    this._id = id
    this._name = name

    this._data = null
    this._origin = null
    this._output = null
  }

  ////////////////////////////////////////
  
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

  ////////////////////////////////////////
}