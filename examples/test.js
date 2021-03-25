// const { Core } = require('../dist')

// import { Core, isplainobject } from '../dist/index.js'
const { Core } = require('../lib/index')
const babelRegister = require('./BabelRegister')

const core = new Core({
  possibleConfigName: ['./examples/config.js'],
  plugins: ['./examples/test-foo'],
  babelRegister
})

// core.args = 1

core
  .applyModifyHooks({
    key: 'test',
    initialValue: []
  })
  .then((res) => {
    console.log(res)
  })
