const Listr = require("listr")

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
    return new Listr([
      {
        title: 'Figure out the new version',
        task: (ctx, task) => FontPublish.compute(ctx, font, task)
      },
      {
        title: 'Save the manifest',
        task: (ctx, task) => FontPublish.manifest(ctx, font, task)
      },
      {
        title: 'Commit the changes',
        task: (ctx, task) => FontPublish.commit(ctx, font, task)
      },
      {
        title: 'Tag the commit',
        task: (ctx, task) => FontPublish.tag(ctx, font, task)
      },
      {
        title: 'Publish on npm',
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
  static compute(ctx, font, task){}

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static manifest(ctx, font, task){}

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static commit(ctx, font, task){}

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