import assert from 'assert'

import { pathToRegister } from './resolvePlugins'
import { ICoreStage } from './enum'

import type {
  IApiRegisterPlugins,
  IApiRegisterMethod,
  IApiDescribe,
  IApiOpitons,
  ICommands,
  IHook
} from './types'

export default class Api {
  /**
   * @desc as an identifier
   */
  path: IApiOpitons['path']

  /**
   * @desc Core prototype
   */
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

  registerPlugins(plugins: IApiRegisterPlugins) {
    assert(
      this.core.stage === ICoreStage.initPlugins,
      `api.registerPlugins() failed, it should only be used in registering stage.`
    )
    assert(Array.isArray(plugins), `api.registerPlugins() failed, plugins must be Array.`)
    // dynamic registration support after processing
    const keepKeys = {}
    const extraPlugins = []

    for (const plugin of plugins) {
      if (typeof plugin === 'string') {
        if (keepKeys[plugin]) {
          continue
        }
        const applyPlugin = pathToRegister(plugin)

        if (this.core.plugins[applyPlugin.path]) {
          throw new Error(`Same plugin registered ${applyPlugin.path}`)
        }

        this.core.extraPlugins.forEach(({ path }) => {
          if (path === applyPlugin.path) {
            throw new Error(`Repeat the plugin to be registered ${applyPlugin.path}`)
          }
        })
        keepKeys[plugin] = 1
        extraPlugins.push(pathToRegister(plugin))

        continue
      }

      if (!plugin.key || !plugin.apply) {
        throw new Error(`Inline plugins must contain 'key' and 'apply'`)
      }
      if (keepKeys[plugin.key]) {
        continue
      }

      keepKeys[plugin.key] = 1
      extraPlugins.push({
        path: plugin.key,
        apply: () => plugin.apply
      })
    }

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
