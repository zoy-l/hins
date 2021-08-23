import { IConfig } from 'zmi-nerd'

export default {
  moduleType: 'cjs',
  target: 'node',
  sourcemap: true,
  extraBabelPlugins: [
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }]
  ]
} as IConfig
