const defaults = require('./defaults')

module.exports = [
  {
    type: 'text',
    name: 'figmaPersonalToken',
    message: 'Your figma token: \n Generate a personal token for figma, read here:\nhttps://www.figma.com/developers/docs#authentication',
    validate: value => value === '' ? 'Generate a personal token for figma, read here:\nhttps://www.figma.com/developers/docs#authentication' : true
  },
  {
    type: 'text',
    name: 'fileId',
    message: 'What is the figma file ID? \n Visit figma project in the browser and copy the id:\nhttps://www.figma.com/file/FILE-ID/project-name',
    validate: value => value === '' ? 'Visit figma project in the browser and copy the id:\nhttps://www.figma.com/file/FILE-ID/project-name' : true
  },
  {
    type: 'text',
    name: 'output',
    message: 'Directory to download the icons to',
    initial: defaults.output
  }
]
