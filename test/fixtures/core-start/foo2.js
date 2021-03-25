export default (api) => {
  api.registerCommand({
    command: 'test-alisa',
    alias: 't',
    fn() {
      return 'test command'
    }
  })
}
