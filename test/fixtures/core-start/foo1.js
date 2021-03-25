export default (api) => {
  // command: string
  // alias?: string
  // description?: string
  // fn: { (args: IArgs): any }
  api.registerCommand({
    command: 'test',
    fn() {
      return 'test command'
    }
  })
}
