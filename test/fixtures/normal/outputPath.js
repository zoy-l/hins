export default (api) => {
  api.describe({
    key: 'outputPath',
    config: {
      default: 'dist',
      schema(joi) {
        console.log(joi)
        return joi.string()
      }
    }
  })
}
