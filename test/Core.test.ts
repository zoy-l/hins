import path from 'path'

import Core from '../src/Core'
import { ICoreApplyHookTypes } from '../src/enum'

const fixtures = path.join(__dirname, './fixtures')

beforeEach(() => {
  jest.resetAllMocks()
})

test('normal', async () => {
  const cwd = path.join(fixtures, 'normal')
  const core = new Core({
    cwd,
    plugins: [
      require.resolve(path.join(cwd, 'plugins_1')),
      require.resolve(path.join(cwd, 'plugins_2')),
      require.resolve(path.join(cwd, 'plugin_1')),
      require.resolve(path.join(cwd, 'plugin_2')),
      require.resolve(path.join(cwd, 'outputPath.js'))
    ]
  })

  core.init()

  expect(Object.keys(core.pluginMethods)).toEqual([
    'onPluginReady',
    'modifyPaths',
    'modifyConfig',
    'onStart'
  ])

  expect(core.internalPlugins.map((paths) => paths.replace(cwd, ''))).toEqual([
    '/plugins_1/index.js',
    '/plugins_2/index.js',
    '/plugin_1.js',
    '/plugin_2.js',
    '/outputPath.js'
  ])

  await core.readyPlugins()
  const plugins = Object.keys(core.plugins)

  expect(plugins.length).toEqual(9)
  expect(plugins.map((plugin) => path.basename(plugin))).toEqual([
    'index.js',
    'plugins_1.js',
    'plugins_2.js',
    'index.js',
    'pluginsssss_1.js',
    'index.js',
    'plugin_1.js',
    'plugin_2.js',
    'outputPath.js'
  ])
})

test('applyHook with add', async () => {
  const cwd = path.join(fixtures, 'applyHook')
  const core = new Core({
    cwd,
    plugins: [require.resolve(path.join(cwd, 'add'))]
  })
  core.init()
  await core.readyPlugins()
  const ret = await core.applyHooks({
    key: 'test',
    type: ICoreApplyHookTypes.add
  })
  expect(ret).toEqual(['a', 'b', 'c', 'd'])

  const res = await core.applyAddHooks({ key: 'test' })
  expect(res).toEqual(['a', 'b', 'c', 'd'])

  await expect(
    core.applyHooks({
      key: 'test',
      type: ICoreApplyHookTypes.add,
      initialValue: 'foo'
    })
  ).rejects.toThrow('when ApplyHooksType is `add`, initialValue must be an array')

  await expect(
    core.applyAddHooks({
      key: 'test',
      initialValue: 'foo'
    })
  ).rejects.toThrow('when ApplyHooksType is `add`, initialValue must be an array')
})

test('applyHook with modify', async () => {
  const cwd = path.join(fixtures, 'applyHook')
  const core = new Core({
    cwd,
    plugins: [require.resolve(path.join(cwd, 'modify'))]
  })
  core.init()
  await core.readyPlugins()
  const ret = await core.applyModifyHooks({
    key: 'test',
    initialValue: []
  })
  expect(ret).toEqual(['a', 'b', 'c', 'd'])

  const res = await core.applyHooks({
    key: 'test',
    type: ICoreApplyHookTypes.modify,
    initialValue: []
  })
  expect(res).toEqual(['a', 'b', 'c', 'd'])
})

test('applyHook with event', async () => {
  const cwd = path.join(fixtures, 'applyHook')
  const core = new Core({
    cwd,
    plugins: [require.resolve(path.join(cwd, 'event'))]
  })
  core.init()
  await core.readyPlugins()

  let count = 0
  await core.applyHooks({
    key: 'test',
    type: ICoreApplyHookTypes.event,
    args: {
      increase(step: number) {
        count += step
      }
    }
  })
  expect(count).toEqual(3)

  await core.applyEventHooks({
    key: 'test',
    args: {
      increase(step: number) {
        count += step
      }
    }
  })

  expect(count).toEqual(6)
})

test('applyHook with unsupported type', async () => {
  const cwd = path.join(fixtures, 'applyHook')
  const core = new Core({
    cwd
  })
  core.init()
  await core.readyPlugins()
  await expect(
    core.applyHooks({
      key: 'test',
      type: 'unsupport-event' as ICoreApplyHookTypes
    })
  ).rejects.toThrow(/type is not defined or is not matched, got/)
})

test('get config before plugin registration', async () => {
  let logData = ''
  console.warn = jest.fn((log) => {
    logData += log
  })
  const cwd = path.join(fixtures, 'get-config')
  const core = new Core({
    cwd,
    plugins: [path.join(cwd, 'foo.js')]
  })
  core.init()
  await core.readyPlugins()
  expect(logData).toEqual('Cannot get config before plugin registration')
})

test('set value', async () => {
  const cwd = path.join(fixtures, 'set-value')
  const core = new Core({
    cwd,
    plugins: [path.join(cwd, 'foo.js')]
  })
  core.init()

  try {
    await core.readyPlugins()
  } catch (err) {
    expect(err.message).toEqual(
      `'set' on proxy: trap returned falsish for property 'config'`
    )
  }
})

test('core start command failed', async () => {
  const cwd = path.join(fixtures, 'core-start')
  const core = new Core({
    cwd,
    plugins: [path.join(cwd, 'foo.js')]
  })

  await expect(core.start({ command: 'test' })).rejects.toThrowError(
    'start command failed, command "test" does not exists.'
  )
})

test('core start', async () => {
  const cwd = path.join(fixtures, 'core-start')
  const core = new Core({
    cwd,
    plugins: [path.join(cwd, 'foo1.js')]
  })

  expect(await core.start({ command: 'test' })).toEqual('test command')
})

test('core start alisa', async () => {
  const cwd = path.join(fixtures, 'core-start')
  const core = new Core({
    cwd,
    plugins: [path.join(cwd, 'foo2.js')]
  })

  expect(await core.start({ command: 't' })).toEqual('test command')
})

test('default path', async () => {
  const core = new Core({})

  expect(core.cwd).toEqual(process.cwd())
})

test('get methods', async () => {
  const cwd = path.join(fixtures, 'get-methods')
  const core = new Core({ cwd, plugins: [path.join(cwd, 'foo.js')] })

  core.init()
  await core.readyPlugins()
})

test('.env', async () => {
  const cwd = path.join(fixtures, 'env')
  const core = new Core({ cwd })
  process.env.JEST_FOO = 'bar'
  core.init()

  expect(process.env.JEST_TEST).toEqual('hins')
  expect(process.env.JEST_FOO).toEqual('bar')
})
