import { Hins } from '../lib'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

module.exports = function (api: Hins) {
  api.register({
    key: 'test',
    fn: (memo) => memo.concat('a')
  })
  api.register({
    key: 'test',
    fn: async (memo) => {
      console.warn(memo)
      await delay(100)
      return memo.concat('b')
    }
  })
  api.register({
    key: 'test',
    fn: (memo) => memo.concat(['c', 'd'])
  })
}
