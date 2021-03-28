module.exports = (api) => {
  api.registerPlugins([
    { key: 'plugin_2', apply: () => {} },
    require.resolve('./plugin_3'),
    { key: 'plugin_2', apply: () => {} }
  ])
}
