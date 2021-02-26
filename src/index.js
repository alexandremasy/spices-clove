import { version } from '../package.json'
const path = 'https://cdn.sayl.cloud/spices/icons/'
const filename = ['spices-icons.svg', version].join('?v=')
const meta = {
  sprite: [path, filename].join(''),
  version
}

export { default as install } from './install'
export { meta }
