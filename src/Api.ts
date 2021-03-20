import type { IApi, IApiDescribe, IApiRegisterMethod, IHook, ICommands } from '@/types'
// import { Cycle } from '@/enum'
import assert from 'assert'

export default class Api {
  path: IApi['path']

  core: IApi['core']

  constructor(options: IApi) {
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
    const { command } = options
    assert(
      !commands[command],
      `api.registerCommand() failed, the command ${command} is exists.`
    )
    commands[command] = options
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
      function (this: Api, method: () => void) {
        this.register({
          key: name,
          fn: method
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
