const { Core } = require('../dist')
const babelRegister = require('./BabelRegister')

const core = new Core({
  possibleConfigName: ['./examples/config.js'],
  plugins: ['./examples/test-foo'],
  babelRegister
})

core.start({})
