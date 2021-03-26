import assert from 'assert'

import { pathToRegister } from './resolvePlugins'
import { ICoreStage } from './enum'

import type {
  IApiRegisterMethod,
  IConfigPlugins,
  IApiDescribe,
  IApiOpitons,
  ICommands,
  IPlugin,
  IHook
} from './types'

export default class Api {
  path: IApiOpitons['path']

  core: IApiOpitons['core']

  constructor(options: IApiOpitons) {
    const { path, core } = options

    this.path = path
    this.core = core
  }

  describe(options: IApiDescribe) {
    const { key, config } = options
    const { plugins } = this.core

    assert(options.key, `api.describe() failed, the plugin is missing an 'key'.`)
    assert(
      options.config.schema && typeof options.config.schema === 'function',
      `api.describe() failed, the plugin is missing 'schema'`
    )

    plugins[this.path].key = key
    plugins[this.path].config = config
  }

  registerCommand(options: ICommands) {
    const { commands } = this.core
    const { command, alias } = options
    assert(
      !commands[command],
      `api.registerCommand() failed, the command ${command} is exists.`
    )
    commands[command] = options

    if (alias) {
      commands[alias] = options
    }
  }

  registerPlugins(plugins: IConfigPlugins | IPlugin) {
    assert(
      this.core.stage === ICoreStage.initPlugins,
      `api.registerPlugins() failed, it should only be used in registering stage.`
    )
    assert(Array.isArray(plugins), `api.registerPlugins() failed, plugins must be Array.`)
    const extraPlugins = plugins.map((plugin) =>
      typeof plugin === 'string' ? pathToRegister(plugin) : plugin
    )

    this.core.extraPlugins.unshift(...extraPlugins)
  }

  registerMethod(options: IApiRegisterMethod) {
    const { pluginMethods } = this.core
    const { fn, name } = options

    assert(
      !pluginMethods[name],
      `api.registerMethod() failed, method ${name} is already exist.`
    )

    pluginMethods[name] =
      fn ??
      function (this: Api, hookOptions: Omit<IHook, 'pluginId'> | (() => any)) {
        const hook = typeof hookOptions === 'function' ? { fn: hookOptions } : hookOptions
        this.register({
          key: name,
          ...hook
        })
      }
  }

  register(options: Omit<IHook, 'pluginId'>) {
    const { hooksByPluginId } = this.core
    assert(
      options.key && typeof options.key === 'string',
      `api.register() failed, hook.key must supplied and should be string, but got ${options.key}.`
    )
    assert(
      typeof options.fn === 'function',
      `api.register() failed, hook.fn must supplied and should be function, but got ${options.fn}.`
    )

    hooksByPluginId[options.key] = (hooksByPluginId[options.key] ?? []).concat({
      pluginId: this.path,
      ...options
    })
  }
}
