const Listr = require("listr")
const semver = require("semver")
const Font = require("../models/font")

module.exports = class FontPublish {
  /**
   * Publish the font
   *
   * @param {Object} options
   * @param {Object} options.ctx
   * @param {Object} options.task
   * @param {Font} options.font
   */
  static exec({ctx, font, task}){
    let n = font._changes.length
    return new Listr([
      {
        title: 'Figure out the new version',
        skip: () => n === 0 ? 'No changes' : false,
        task: (ctx, task) => FontPublish.compute(ctx, font, task)
      },
      {
        title: 'Save the manifest',
        skip: () => n === 0 ? 'No changes' : false,
        task: (ctx, task) => FontPublish.manifest(ctx, font, task)
      },
      {
        title: 'Commit the changes',
        skip: () => n === 0 ? 'No changes' : false,
        task: (ctx, task) => FontPublish.commit(ctx, font, task)
      },
      {
        title: 'Tag the commit',
        skip: () => n === 0 ? 'No changes' : false,
        task: (ctx, task) => FontPublish.tag(ctx, font, task)
      },
      {
        title: 'Publish on npm',
        skip: () => n === 0 ? 'No changes' : false,
        task: (ctx, task) => FontPublish.npm(ctx, font, task)
      },
    ])
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static compute(ctx, font, task){
    // currently only use the patch until a better changelog detection
    let next = semver.inc(font.version, 'patch')
    font.version = next

    return Promise.resolve()
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static manifest(ctx, font, task){
    return font.save()
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static commit(ctx, font, task){
    let message = `Version ${font.version}. ${font._changes.length} changes.

    ${font._changes.toString()}`
    let command = `git add src/* && git commit -a -m ${message}`

    console.log('mesage', message);
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static tag(ctx, font, task){}

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static npm(ctx, font, task){}
}