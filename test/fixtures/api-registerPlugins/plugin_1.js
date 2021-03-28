module.exports = (api) => {
  api.registerPlugins([
    { path: 'plugin_2', apply: () => () => {} },
    require.resolve('./plugin_3')
  ])
}
