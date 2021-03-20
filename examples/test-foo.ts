export default (api) => {
  debugger

  api.describe({
    key: 'cache',
    config: {
      default: 'memory',
      schema(joi) {
        return joi.valid('memory', 'filesystem')
      }
    }
  })

  api.onPluginReady(() => {
    // console.log(api.initConfig)
  })
}
