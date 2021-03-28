module.exports = (api) => {
  api.registerPlugins([
    require.resolve('./plugin_3.js'),
    require.resolve('./plugin_3.js')
  ])
}
