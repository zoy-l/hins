export default (api) => {
  api.describe({
    key: 'foo',
    config: {
      schema(joi) {
        return joi.string()
      }
    }
  })
}
