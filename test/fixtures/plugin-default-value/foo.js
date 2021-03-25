export default (api) => {
  api.describe({
    key: 'foo',
    config: {
      default: 1,
      schema(joi) {
        return joi.number()
      }
    }
  })
}
