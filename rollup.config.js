import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import copy from 'rollup-plugin-copy'
import ts from 'typescript'
import path from 'path'

const externalTypes = [
  'lodash.isplainobject',
  'lodash.clonedeep',
  'lodash.isequal',
  'lodash.merge',
  'clear-module',
  'lodash.uniq',
  'chokidar',
  'slash',
  'joi'
]

/**
 * @type { import('rollup').RollupOptions }
 */
export default {
  input: path.resolve(__dirname, 'src/index.ts'),
  external: ['fsevents', 'joi', ...Object.keys(require('./package.json').dependencies)],
  plugins: [
    copy({
      targets: [
        {
          src: 'node_modules/slash/index.d.ts',
          dest: 'dist',
          rename: 'slash.d.ts'
        },
        {
          src: 'node_modules/chokidar/types/index.d.ts',
          dest: 'dist',
          rename: 'chokidar.d.ts'
        },
        {
          src: 'node_modules/clear-module/index.d.ts',
          dest: 'dist',
          rename: 'clear-module.d.ts'
        },
        {
          src: 'node_modules/joi/lib/index.d.ts',
          dest: 'dist',
          rename: 'joi.d.ts'
        }
      ]
    }),
    nodeResolve({ preferBuiltins: true }),
    typescript({
      target: 'es2016',
      include: ['src/*.ts'],
      declarationDir: path.resolve(__dirname, 'dist'),
      baseUrl: '.',
      transformers: {
        afterDeclarations: [
          (context) => {
            const visit = (node) => {
              if (ts.isStringLiteral(node)) {
                if (externalTypes.includes(node.text)) {
                  const literal = node.text.split('.')
                  return ts.createStringLiteral(`./${literal[literal.length - 1]}`)
                }
              }

              return ts.visitEachChild(node, visit, context)
            }

            return (source) => ts.visitNode(source, visit)
          }
        ]
      }
    }),

    commonjs({ extensions: ['.js'] }),
    json()
  ],
  output: {
    dir: path.resolve(__dirname, 'dist'),
    format: 'cjs'
  }
}

// 'resolve',
// 'chalk',

// {
//   src: 'node_modules/@types/resolve/index.d.ts',
//   dest: 'dist',
//   rename: 'resolve.d.ts'
// },

// {
//   src: 'node_modules/chalk/index.d.ts',
//   dest: 'dist',
//   rename: 'chalk.d.ts'
// },
