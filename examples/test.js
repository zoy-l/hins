const Core = require('../lib/Core').default

const core = new Core({
  possibleConfigPaths: ['config.js'],
  plugins: ['./examples/test-foo']
})

core.start({})
