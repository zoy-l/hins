import path from 'path'

import Core from '../src/Core'
import slash from 'slash'

const fixtures = path.join(__dirname, './fixtures')

const simplyPluginIds = ({ cwd, plugins }: { cwd: string; plugins: any }) =>
  Object.keys(plugins).map((id) => `[plugin] ${id.replace(slash(cwd), '.')}`)

test('api registerPlugins', async () => {
  const cwd = path.join(fixtures, 'api-registerPlugins')
  const core = new Core({
    cwd,
    plugins: [require.resolve(path.join(cwd, 'plugin_1'))]
  })
  core.init()
  await core.readyPlugins()
  const plugins = simplyPluginIds({
    cwd,
    plugins: core.plugins
  })

  expect(plugins).toEqual([
    '[plugin] ./plugin_1.js',
    '[plugin] plugin_2',
    '[plugin] ./plugin_3.js'
  ])
})

test('api registerMethod fail if exist', async () => {
  const cwd = path.join(fixtures, 'api-registerMethod')
  const core = new Core({
    cwd,
    plugins: [
      require.resolve(path.join(cwd, 'plugin_1')),
      require.resolve(path.join(cwd, 'plugin_1_duplicated'))
    ]
  })
  core.init()
  await expect(core.readyPlugins()).rejects.toThrow(
    /api\.registerMethod\(\) failed, method foo is already exist/
  )
})

test('api registerMethod should have the right plugin id', async () => {
  const cwd = path.join(fixtures, 'api-registerMethod')
  const core = new Core({
    cwd,
    plugins: [
      require.resolve(path.join(cwd, 'plugin_3')),
      require.resolve(path.join(cwd, 'plugin_3_api_foo'))
    ]
  })
  core.init()
  await core.readyPlugins()

  expect(Object.keys(core.hooksByPluginId)[0]).toContain('foo')
})
