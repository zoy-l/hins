module.exports = (api) => {
  api.registerPlugins([
    { path: 'plugin_2', key: 'plugin2', apply: () => () => {} },
    require.resolve('./plugin_3')
  ])
}
