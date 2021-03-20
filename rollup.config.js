import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import path from 'path'

export default {
  input: path.resolve(__dirname, 'src/index.ts'),
  external: ['fsevents', 'chokidar', 'joi', 'chalk'],
  plugins: [
    nodeResolve(),
    typescript({
      target: 'es2016',
      include: ['src/*.ts'],
      declarationDir: path.resolve(__dirname, 'dist/types'),
      baseUrl: '.'
    }),
    commonjs({ extensions: ['.js'] }),
    json()
  ],
  output: {
    dir: path.resolve(__dirname, 'dist'),
    format: 'cjs'
  }
}
