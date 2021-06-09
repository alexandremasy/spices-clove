const { name } = require('../../package.json');
const path = require('path')
const output = path.resolve('src')

module.exports = {
  name: name,
  
  cdn: `https://cdn.jsdelivr.net/gh/alexandremasy/spices-clove`,
  figma_personal_token: "158843-2c12d5ef-af37-44f7-af74-bb0b97e54139",

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
