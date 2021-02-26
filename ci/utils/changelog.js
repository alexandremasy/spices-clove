module.exports = class Changelog{
  /**
   * @constructor
   * @param {Array} changes 
   */
  constructor(changes){
    this._changes = changes
  }

  /**
   * @property {Boolean} hasChanges Whether or not the latest build generated some changes to publish 
   */
  get hasChanges() {
    return this._changes && this._changes.length > 0
  }

  /**
   * String representation of the changelog
   */
  toString(){
    let ret = this._changelog.map(c => {
      let action = ''
      if (c.deleted) action = 'removed'
      if (c.added) action = 'added'
      if (c.modified) action = 'updated'

      return `icon ${c.name} ${action}`
    })

    return ret.join('\n')
  }
}