import { IConfig } from 'zmi-nerd'

export default {
  moduleType: 'cjs',
  target: 'node',
  browserFiles: ['src/hello.js', 'src/test.js', 'src/abc.js']
} as IConfig
