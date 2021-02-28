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
  figma_file_id: "U2TtGONui0MxqNh6fo0QVX",
  
  // 
  //  Outputs
  // 
  output,
  iconfont: path.resolve(output, 'iconfont'),
  iconfont_svg: path.resolve(output, 'iconfont', 'spices-icons.svg'),
  iconfont_ttf: path.resolve(output, 'iconfont', 'spices-icons.ttf'),
  iconfont_woff: path.resolve(output, 'iconfont', 'spices-icons.woff'),
  iconfont_woff2: path.resolve(output, 'iconfont', 'spices-icons.woff2'),
  
  icons: path.resolve(output, 'icons'),
  outlined: path.resolve(output, 'outlined'),
  scss: path.resolve(output, 'spices-icons.scss'),
  sprite: path.resolve(output, 'spices-icons.svg'),
  sprite_public: [s3_url, ['spices-icons.svg', next].join('?v=')].join('')
  
  
}
