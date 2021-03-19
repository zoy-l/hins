import path from 'path'
import { IConfig } from 'zmi-nerd'

export default {
  moduleType: 'cjs',
  target: 'node',
  paths: {
    '@': path.join(__dirname, 'src')
  },
  sourcemap: true
} as IConfig
