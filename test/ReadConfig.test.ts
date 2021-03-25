import stripAnsi from 'strip-ansi'
import path from 'path'
import fs from 'fs'

import Core from '../src/Core'
import ReadConfig from '../src/ReadConfig'

const fixtures = path.join(__dirname, './fixtures')

const wait = () => new Promise((resolve) => setTimeout(resolve, 1500))
jest.setTimeout(30000)

test('schema', async () => {
  const cwd = path.join(fixtures, 'schema')
  const core = new Core({
    cwd,
    possibleConfigName: ['config.js'],
    plugins: [path.join(cwd, 'pluginSchema.js')]
  })

  await expect(core.start({ command: 'test' })).rejects.toThrow(
    /"value" must be a number/
  )
})

test('configs', async () => {
  const cwd = path.join(fixtures, 'config')
  const readConfig = new ReadConfig({
    possibleConfigName: ['config.ts', 'config.js'],
    core: new Core({ cwd })
  })

  const userConfig = readConfig.getConfigFile() as string
  expect(path.basename(userConfig)).toEqual('config.ts')

  process.env.HINS_CONFIG_ENV = 'dev'
  const userConfigDev = readConfig.getConfigFile() as string
  expect(path.basename(userConfigDev)).toEqual('config.dev.ts')
  delete process.env.HINS_CONFIG_ENV
})

test('No configs ', async () => {
  const cwd = path.join(fixtures, 'config')
  const readConfig = new ReadConfig({
    possibleConfigName: ['foo.js'],
    core: new Core({ cwd })
  })

  const userConfig = readConfig.getConfigFile()
  expect(userConfig).toEqual(false)
})

test('configs priority', async () => {
  const cwd = path.join(fixtures, 'config')
  const readConfig = new ReadConfig({
    possibleConfigName: ['foo.js', 'config.js'],
    core: new Core({ cwd })
  })

  const userConfig = readConfig.getConfigFile() as string
  expect(path.basename(userConfig)).toEqual('config.js')
})

test('plugins no key', async () => {
  const cwd = path.join(fixtures, 'plugin-noKey')
  const core = new Core({
    possibleConfigName: ['config.js'],
    cwd,
    plugins: [path.join(cwd, 'foo.js'), path.join(cwd, 'foo1.js')]
  })

  core.init()
  await core.readyPlugins()

  expect(core.configInstance.getConfig()).toEqual({ foo: 1 })
})

test('plugin multiple same key', async () => {
  const cwd = path.join(fixtures, 'plugin-multiple-same')
  const core = new Core({
    cwd,
    plugins: [path.join(cwd, 'foo.js'), path.join(cwd, 'foo1.js')]
  })

  core.init()
  await core.readyPlugins()

  try {
    core.configInstance.getConfig()
  } catch (err) {
    expect(err.message).toEqual('have multiple same foo')
  }
})

test('plugin default value', async () => {
  const cwd = path.join(fixtures, 'plugin-default-value')
  const core = new Core({
    cwd,
    plugins: [path.join(cwd, 'foo.js')]
  })

  core.init()
  await core.readyPlugins()
  await core.readyConfig()
  expect(core.config).toEqual({ foo: 1 })
})

test('config invalid key', async () => {
  const cwd = path.join(fixtures, 'config-invalid-key')
  const core = new Core({
    cwd,
    possibleConfigName: ['config.js']
  })

  core.init()
  await core.readyPlugins()
  await expect(core.readyConfig()).rejects.toThrow('Invalid config key: foo')
})

test('config invalid keys', async () => {
  const cwd = path.join(fixtures, 'config-invalid-key')
  const core = new Core({
    cwd,
    possibleConfigName: ['configs.js']
  })

  core.init()
  await core.readyPlugins()
  await expect(core.readyConfig()).rejects.toThrow('Invalid config keys: foo, bar')
})

test('config watch', async () => {
  let outputData = ''
  console.log = jest.fn((log) => {
    outputData += log
  })

  const cwd = path.join(fixtures, 'config-watch')

  const core = new Core({
    cwd,
    possibleConfigName: ['config.js'],
    plugins: [path.join(cwd, 'foo.js')]
  })

  core.start = async () => {}

  const configPath = path.join(cwd, 'config.js')
  const config = fs.readFileSync(configPath, 'utf-8').toString()

  core.init()
  await core.readyPlugins()
  await core.readyConfig()

  require.cache[configPath].exports = { foo: 'bar key' }
  fs.writeFileSync(configPath, config.replace('foo key', 'bar key'), 'utf-8')
  await wait()
  require.cache[configPath].exports = { foo: 'foo key' }
  fs.writeFileSync(configPath, config, 'utf-8')
  await wait()

  const logArr = stripAnsi(outputData).split(' ').filter(Boolean)

  let is = true

  if (!logArr.includes('change') || !logArr.includes('restart...')) {
    is = false
  }

  expect(is).toEqual(true)

  jest.resetAllMocks()
})
