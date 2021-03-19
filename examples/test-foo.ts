export default (api) => {
  api.describe({
    key: 'cache',
    config: {
      default: 'memory',
      schema(joi) {
        return joi.valid('memory', 'filesystem')
      }
    }
  })
}
