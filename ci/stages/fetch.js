const Listr = require("listr")
const Font = require("../models/font")
const { basil } = require('@spices/basil')

module.exports = class FontFetch {

  static exec({ ctx, font, task }){
    return new Listr([
      {
        title: 'Snapshot the glyphs',
        task: (ctx, task) => FontFetch.snapshot(ctx, font, task)
      },
      {
        title: 'Download the glyphs',
        task: (ctx, task) => FontFetch.download(ctx, font, task)
      },
      {
        enabled: () => false,
        title: 'Outline the glyphs',
        task: (ctx, task) => FontFetch.outline(ctx, font, task)
      },
      {
        enabled: () => false,
        title: 'Optimize the glyphs',
        task: (ctx, task) => FontFetch.optimize(ctx, font, task)
      },
      {
        enabled: () => false,
        title: 'Fix the glyphs paths',
        task: (ctx, task) => FontFetch.fix(ctx, font, task)
      },
      {
        enabled: () => false,
        title: 'Update the changelog',
        task: (ctx, task) => FontFetch.changelog(ctx, font, task)
      },

    ])
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static snapshot(ctx, font, task){
    return FontFetch.iterator({ 
      fn: 'snapshot', 
      font,
      n: 10, 
      title: (i, n) => task.title = `Snapshoting the glyphs [${i}/${n}]` 
    })
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static download(ctx, font, task){
    return FontFetch.iterator({ 
      fn: 'download', 
      font,
      n: 50, 
      task, 
      title: (i, n) => task.title = `Downloading the glyphs [${i}/${n}]` 
    })
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static outline(ctx, font, task){
    return FontFetch.iterator({ 
      fn: 'outline', 
      font, 
      n: 10, 
      task, 
      title: (i, n) => task.title = `Outlining the glyphs [${i}/${n}]` 
    })
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static optimize(ctx, font, task){
    return FontFetch.iterator({ 
      fn: 'optimize', 
      font, 
      n: 50, 
      task, 
      title: (i, n) => task.title = `Optimizing the glyphs [${i}/${n}]` 
    })
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static fix(ctx, font, task){
    return new Promise((resolve, reject) => {
      const execute = require('../utils/execute')
      const path = require('path')
      const config = require('../utils/config')

      let script = path.resolve(__dirname, '../outline.py')
      let p = path.resolve(__dirname, '../../', font.system, config.folder_icons)
      let command = `fontforge -lang=py -script ${script} ${p}`
      execute(command, { verbose: false })
        .then(() => {
          return resolve()
        })
        .catch(e => {
          console.log('Error')
          console.log(e)
        })
    })
  }

  /**
   * @param {*} client
   * @param {*} ctx
   * @param {Font} font
   * @returns {Promise}
   */
  static changelog(ctx, font, task){
    return new Promise((resolve, reject) => {
      task.title = 'Updating the changelog'
      let updates = font.glyphs.filter(g => g.updated === true).flatMap(g => g.name)

      let debug = font.glyphs.find(g => g.name === updates[0])
      console.log(debug.data);
      console.log('---------');
      console.log(debug._data);

      console.log('updates', updates.length)
      console.log(updates);

      resolve()
    })
  }

  /**
   * Iterate over all the glyphs to execute a promise function
   * 
   * @param {Object} options 
   * @param {Object} options.fn 
   * @param {Object} options.n 
   * @param {Object} options.title
   */
  static iterator({ fn, font, n = 10, title }) {
    return new Promise((resolve, reject) => {
      let i = 0
      let m = font.glyphs.length
      title(i, m)

      let iterator = (g) => new Promise((resolve, reject) => {
        g[fn]().then(() => {
          i++;
          title(i, m);
          return resolve()
        })
      })

      let tasks = font.glyphs.map(g => iterator.bind(null, g))
      basil.sequence(tasks, n)
        .then(() => resolve())
        .catch(e => { console.error(e); return reject(e); })
    })
  }
}