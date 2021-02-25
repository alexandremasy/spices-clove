const { version, name } = require('../../package.json');

module.exports = {
  debug: false,
  verbose: false,
  step: null,
  
  name: name,
  version: version,
  next: version,
  
  branch: 'master',
  release: 'minor',
  output: 'src',
  
  npm: false,
  discord: true,
  avatar: 'http://cdn.sayl.cloud/libs/ci/jenkins.png',
  
  s3: true,
  s3_exists: false,
  s3_bucket: 's3://cdn-sayl/spices/icons/',

  figma_personal_token: "158843-2c12d5ef-af37-44f7-af74-bb0b97e54139",
  figma_file_id: "U2TtGONui0MxqNh6fo0QVX",
}
