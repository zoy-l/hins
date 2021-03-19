export default (api) => {
  console.log(api)

  api.describe({
    key: 'cache',
    config: {
      schema(joi) {
        return joi.valid('memory', 'filesystem')
      }
    }
  })
}
