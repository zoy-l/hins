module.exports = (api) => {
  api.foo(() => {})
  api.foo({ fn: () => {} })
}
