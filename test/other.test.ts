import { mergeDefault, funcString } from '../src/tools'

test('mergeDefault normal', () => {
  const ret = mergeDefault({ defaultConfig: { foo: 1 }, config: { foo: 2 } })
  expect(ret).toEqual({ foo: 2 })
})

test('mergeDefault not config', () => {
  const ret = mergeDefault({ defaultConfig: { foo: 1 }, config: () => {} })
  expect(ret()).toEqual(undefined)
})

test('funcString', () => {
  const ret = funcString(() => 123)

  expect(ret).toEqual('() => 123')
})
