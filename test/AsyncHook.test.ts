import AsyncHook from '../src/AsyncHook'

test('AsyncHook befores', async () => {
  const hook = new AsyncHook()
  const taps = [
    {
      name: 'foo',
      async fn(memo: string) {
        memo += 'foo'
        return memo
      }
    },
    {
      name: 'foo1',
      async fn(memo: string) {
        memo += 'foo1'
        return memo
      },
      before: 'foo'
    },
    {
      name: 'foo2',
      async fn(memo: string) {
        memo += 'foo2'
        return memo
      },
      before: ['foo']
    }
  ]
  hook.tap(taps)

  expect(await hook.tapCall('')).toEqual('foo1foo2foo')
})

test('AsyncHook stage', async () => {
  const hook = new AsyncHook()
  const taps = [
    {
      name: 'foo',
      async fn(memo: string) {
        memo += 'foo'
        return memo
      }
    },
    {
      name: 'foo1',
      async fn(memo: string) {
        memo += 'foo1'
        return memo
      }
    },
    {
      name: 'foo2',
      async fn(memo: string) {
        memo += 'foo2'
        return memo
      },
      stage: -1
    }
  ]
  hook.tap(taps)

  expect(await hook.tapCall('')).toEqual('foo2foofoo1')
})

test('AsyncHook befores not key', async () => {
  const hook = new AsyncHook()
  const taps = [
    {
      name: 'foo',
      async fn(memo: string) {
        memo += 'foo'
        return memo
      }
    },
    {
      name: 'foo1',
      async fn(memo: string) {
        memo += 'foo1'
        return memo
      }
    },
    {
      name: 'foo2',
      async fn(memo: string) {
        memo += 'foo2'
        return memo
      }
    },
    {
      name: 'foo3',
      async fn(memo: string) {
        memo += 'foo3'
        return memo
      },
      before: ['k', 'foo2', 'hel']
    }
  ]

  try {
    hook.tap(taps)
  } catch (err) {
    expect(err.message).toEqual('key name not found: k, hel')
  }
})
