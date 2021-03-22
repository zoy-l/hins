// const { Core } = require('../dist')
const { Core } = require('../lib/index')
const babelRegister = require('./BabelRegister')

const core = new Core({
  possibleConfigName: ['./examples/config.js'],
  plugins: ['./examples/test-foo'],
  babelRegister
})

core.start({})
