import { version } from '../package.json'
const path = 'https://cdn.sayl.cloud/spices/icons/'
const sprite = ['spices-icons.svg', version].join('?v=')
const json = ['spices-icons.json', version].join('?v=')
const meta = {
  json: [path, json].join(''),
  sprite: [path, sprite].join(''),
  version
}

export { default as install } from './install'
export { meta }
