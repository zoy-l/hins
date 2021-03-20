const Core = require('../lib/Core').default
const babelRegister = require('./BabelRegister')

const core = new Core({
  possibleConfigName: ['./examples/config.js'],
  plugins: ['./examples/test-foo'],
  babelRegister
})

core.start({})
