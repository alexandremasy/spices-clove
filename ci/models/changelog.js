const ChangelogType = require('./vos/changelog-type')
const FontGlyph = require('./font-glyph')

module.exports = class Changelog{
  /**
   * @constructor
   * @param {Array} [changes=[]] 
   */
  constructor(changes = []){
    this._changes = changes
  }

  /**
   * @property {Boolean} hasChanges Whether or not the latest build generated some changes to publish 
   */
  get hasChanges() {
    return this._changes && this._changes.length > 0
  }

  /**
   * @property {Number} length The number of items in the changelog
   */
  get length(){
    return this._changes.length
  }

  /**
   * Register the add of a new glyph
   * @param {FontGlyph} glyph 
   */
  add(glyph){
    this._changes.push({
      type: ChangelogType.ADD,
      glyph
    })
  }

  /**
   * Register the deletion of a glyph
   * @param {FontGlyph} glyph 
   */
  delete(glyph){
    this._changes.push({
      type: ChangelogType.DELETE,
      glyph
    })
  }

  /**
   * Register the edition of a glyph
   * @param {FontGlyph} glyph 
   */
  edit(glyph){
    this._changes.push({
      type: ChangelogType.EDIT,
      glyph
    })
  }

  /**
   * String representation of the changelog
   */
  toString(){
    let ret = this._changes.map(c => {
      let action = ''
      if (c.type === ChangelogType.DELETE) action = 'removed'
      if (c.type === ChangelogType.ADD) action = 'added'
      if (c.type === ChangelogType.EDIT) action = 'updated'

      return `- icon \`${c.glyph.name}\` ${action}`
    })

    return ret.join('\n')
  }
}