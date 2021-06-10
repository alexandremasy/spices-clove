const { name } = require('../../package.json');
const path = require('path')
const output = path.resolve('src')

module.exports = {
  name: name,
  
  cdn: `https://cdn.jsdelivr.net/gh/alexandremasy/spices-clove`,
  figma_personal_token: process.env.FIGMA_PERSONAL_TOKEN,

  // 
  //  Outputs
  // 
  output,
  folder_icons: 'icons',
  folder_webfont: 'webfonts',

  svgo: {
    plugins: [
      'cleanupAttrs',
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeTitle',
      'removeDesc',
      // 'removeUselessDefs',
      'removeEditorsNSData',
      'removeEmptyAttrs',
      // 'removeHiddenElems',
      'removeEmptyText',
      'removeEmptyContainers',
      'removeViewBox',
      // 'cleanupEnableBackground',
      // 'convertStyleToAttrs',
      // 'convertColors',
      // 'convertPathData',
      // 'convertTransform',
      // 'removeUnknownsAndDefaults',
      'removeNonInheritableGroupAttrs',
      // 'removeUselessStrokeAndFill',
      // 'removeUnusedNS',
      // 'cleanupIDs',
      // 'cleanupNumericValues',
      // 'moveElemsAttrsToGroup',
      // 'moveGroupAttrsToElems',
      // 'collapseGroups',
      // 'removeRasterImages',
      // 'mergePaths',
      // 'convertShapeToPath',
      'sortAttrs',
      // 'removeDimensions',
      // { name: 'removeAttrs', attrs: '(stroke|fill)' },
    ]
  }
}
