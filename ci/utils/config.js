const { version, name } = require('../../package.json');
const semver = require('semver')
const path = require('path')

const output = path.resolve('src')
const s3_url = 'https://cdn.sayl.cloud/spices/icons/'
const next = semver.inc(version, 'minor')

module.exports = {
  debug: false,
  verbose: false,
  step: null,
  
  name: name,
  version: version,
  next,
  changelog: null,
  list: [],
  
  branch: 'master',
  release: 'minor',
  
  npm: false,
  discord: true,
  avatar: 'http://cdn.sayl.cloud/libs/ci/jenkins.png',
  
  s3: true,
  s3_exists: false,
  s3_bucket: 's3://cdn-sayl/spices/icons/',
  s3_url,
  
  figma_personal_token: "158843-2c12d5ef-af37-44f7-af74-bb0b97e54139",

  // 
  //  Outputs
  // 
  output,
  folder_icons: 'icons',
  folder_webfont: 'webfonts',
  iconsFolderName: 'icons',

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
