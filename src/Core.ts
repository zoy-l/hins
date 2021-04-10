import cloneDeep from 'lodash.clonedeep'
import uniq from 'lodash.uniq'
import assert from 'assert'
import slash from 'slash'
import path from 'path'

import resolvePlugins, { pathToRegister } from './resolvePlugins'
import { ICoreStage, ICoreApplyHookTypes, Cycle } from './enum'
import ReadConfig from './ReadConfig'
import AsyncHook from './AsyncHook'
import env from './env'
import Api from './Api'
import type {
  IConfigPlugins,
  ICoreApplyHook,
  IApplyPlugin,
  ITypeHooks,
  ICoreStart,
  ICommands,
  INonEmpty,
  IWorkDir,
  IMethods,
  IPlugin,
  IConfig,
  ICore,
  IHook
} from './types'

export default class Core {
  /**
   * @desc directory path
   */
  cwd: IWorkDir

  /**
   * @desc extra command
   */
  args?: ICoreStart

  /**
   * @desc registered Plugins
   */
  plugins: Record<string, IPlugin> = {}

  /**
   * @desc list of plugins when registering,
   */
  extraPlugins: IApplyPlugin[] = []

  /**
   * @desc initial Plugins
   */
  initPlugins: IApplyPlugin[] = []

  /**
   * @desc registered commands
   */
  commands: Record<string, ICommands> = {}

  /**
   * @desc Apply Plugin enumeration value, provide a plug-in use
   */
  ApplyHookType = ICoreApplyHookTypes

  /**
   * @desc plugin Methods
   */
  pluginMethods: Record<string, IMethods> = {}

  /**
   * @desc { Record<string, IHook[]> }
   */
  hooksByPluginId: Record<string, IHook[]> = {}

  /**
   * @desc lifecycle stage
   */
  stage: ICoreStage = ICoreStage.uninitialized

  /**
   * @desc enum lifecycle
   */
  coreStage = ICoreStage

  /**
   * @desc internal Plugins
   */
  internalPlugins: IConfigPlugins

  /**
   * @desc Initialize the configuration file, the config at this time is still to be verified
   */
  initConfig: IConfig = {}

  /**
   * @desc the final processed config
   */
  config: IConfig = {}

  /**
   * @desc Config Instance
   */
  configInstance: ReadConfig

  /**
   * @desc runtime babel
   */
  babelRegister: INonEmpty<ICore>['babelRegister']

  /**
   * @desc monitor config
   */
  watchConfig: INonEmpty<ICore>['watchConfig']

  /**
   * @desc applyHooks shortcut
   */
  applyAddHooks: ITypeHooks

  /**
   * @desc applyHooks shortcut
   */
  applyModifyHooks: ITypeHooks

  /**
   * @desc applyHooks shortcut
   */
  applyEventHooks: ITypeHooks

  /**
   * @desc api Instance
   */
  ApiInstance: Api

  /**
   * @name Core
   * @param { Function } options.babelRegister - provide config runtime. `type:Function`
   * @param { Array } options.possibleConfigName - config name path `type:string[]`
   * @param { Array } options.plugins Array - default plugin `type:string[]`
   * @param { object } options.isWatch - watch config `type:object`
   * @param { string } options.cwd - work path `type:string`
   */
  constructor(options: ICore) {
    // text prompt when watch config
    this.watchConfig = options.watchConfig ?? {
      changeLog: (event, paths) => {
        console.log(` ${event} `, paths)
      },
      reloadLog: () => {
        console.log(`Try to restart...`)
      }
    }
    this.cwd = options.cwd ?? process.cwd()
    this.internalPlugins = options.plugins ?? []
    this.babelRegister = options.babelRegister ?? (() => {})

    // apply hooks alias for easy use
    this.applyAddHooks = (options) =>
      this.applyHooks({ ...options, type: ICoreApplyHookTypes.add })

    this.applyModifyHooks = (options) =>
      this.applyHooks({ ...options, type: ICoreApplyHookTypes.modify })

    this.applyEventHooks = (options) =>
      this.applyHooks({ ...options, type: ICoreApplyHookTypes.event })

    this.configInstance = new ReadConfig({
      possibleConfigName: options.possibleConfigName ?? [],
      core: this
    })
    this.initConfig = this.configInstance.getUserConfig()

    this.ApiInstance = new Api({ core: this })

    this.registerLifeCycle()
  }

  registerLifeCycle() {
    // Initialize the registration lifecycle hook
    this.ApiInstance.path = 'internal'
    Cycle.forEach((name) => {
      this.ApiInstance.registerMethod({ name })
    })
  }

  setStage(stage: ICoreStage) {
    this.stage = stage
  }

  init() {
    this.initPlugins = resolvePlugins({
      plugins: this.internalPlugins,
      cwd: this.cwd
    })

    // duplicate processing, no need to deal with it later
    this.babelRegister(uniq(this.initPlugins.map((plugin) => slash(plugin.path))))

    env(path.join(this.cwd, '.env'))
  }

  async applyHooks(options: ICoreApplyHook) {
    const { add, modify, event } = this.ApplyHookType
    const { key, type, args } = options
    let { initialValue } = options

    if (type === add && initialValue && !Array.isArray(initialValue)) {
      throw new Error('when ApplyHooksType is `add`, initialValue must be an array')
    }

    if (type === add && initialValue === undefined) {
      initialValue = []
    }

    const hooks = this.hooksByPluginId[key] ?? []
    const asyncHook = new AsyncHook()

    // Add hook method into the actuator
    // Prepare for later
    const apply = (func: (hook: IHook) => (memo: any) => Promise<any>) => {
      asyncHook.tap(
        hooks.map((hook) => ({
          before: hook.before,
          name: hook.pluginId,
          stage: hook.stage,
          fn: func(hook)
        }))
      )
    }

    // `add` requires return values, these return values will eventually be combined into an array
    // `modify`, need to modify the first parameter and return
    // `event`, no return value
    switch (type) {
      case add:
        apply((hook) => async (memo) => {
          const items = await hook.fn(args)
          return memo.concat(items)
        })
        break
      case modify:
        apply((hook) => async (memo) => hook.fn(memo, args))
        break
      case event:
        apply((hook) => async () => {
          await hook.fn(args)
        })
        break
      default:
        throw new Error(
          `applyPlugin failed, type is not defined or is not matched, got ${type}.`
        )
    }

    return asyncHook.tapCall(initialValue)
  }

  async readyPlugins() {
    this.setStage(ICoreStage.init)
    this.extraPlugins = cloneDeep(this.initPlugins)

    this.setStage(ICoreStage.initPlugins)
    while (this.extraPlugins.length) {
      const { path, apply } = this.extraPlugins.shift()!
      this.ApiInstance.path = path
      // guarantee that you can use it when you register
      // may change later
      // this is not very good
      const api = new Proxy(this.ApiInstance, {
        get: (target, prop: string) => {
          if (prop === 'config' && this.stage < ICoreStage.pluginReady) {
            console.warn(`Cannot get config before plugin registration`)
          }

          // circular reference here
          if (prop === 'ApiInstance') {
            return undefined
          }
          // the plugin Method has the highest weight,
          // followed by Service finally plugin API
          // Because pluginMethods needs to be available in the register phase
          // the latest updates must be obtained through the agent dynamics
          // to achieve the effect of registration and use
          return (
            this.pluginMethods[prop] ??
            (this[prop]
              ? typeof this[prop] === 'function'
                ? this[prop].bind(this)
                : this[prop]
              : target[prop])
          )
        }
      })

      // Plugin is cached here for checking
      this.plugins[path] = { path, apply }

      // Plugin or Plugins
      // Execute plugin method and pass in api.any
      // There are two situations here
      // 1. Import the plug-in collection, then return a string[]
      // 2. Execute plug-in method and pass in api
      // there is an extra, no `require` is used, but `import` is used
      // and ʻimport` is a Promise, so `await` is needed here
      // An error will be reported here because `ESlint` prohibits all circular use of `await`
      // It is safe to use `await` in a loop without callback
      // eslint-disable-next-line no-await-in-loop
      const rest = await apply()(api)

      // If it is an Array
      // It represents a collection of plugins added to the top of extraPlugins
      // Path verification pathToRegister has been done
      // `reverse` to ensure the order of plugins
      if (rest && Array.isArray(rest.plugins) && rest.plugins.length) {
        this.babelRegister(rest.plugins)
        rest.plugins.reverse().forEach((path) => {
          this.extraPlugins.unshift(pathToRegister(path))
        })
      }
    }

    this.setStage(ICoreStage.pluginReady)
    await this.applyEventHooks({
      key: 'onPluginReady'
    })
  }

  async readyConfig() {
    // merge defaults
    // verify config value
    this.setStage(ICoreStage.getConfig)

    this.config = await this.applyModifyHooks({
      key: 'modifyConfig',
      initialValue: this.configInstance.getConfig(this.initConfig)
    })
  }

  /**
   * @name start
   * @param { string } options.args - other argument.
   * @param { string } options.command - command
   */
  async start(options: ICoreStart) {
    const { args, command, reloadCommand } = options
    this.args = options

    // sometimes it needs to be distributed
    // for example:
    // Register an empty command,
    // execute the operation in the command plugin,
    // and then decide which command to execute
    if (!reloadCommand) {
      this.init()

      await this.readyPlugins()
      await this.readyConfig()

      this.setStage(ICoreStage.start)
      // potential problems,
      // do you need to repeat the implementation here to be verified
      await this.applyEventHooks({
        key: 'onStart',
        args: { args }
      })
    }

    const event = this.commands[command]
    assert(event, `start command failed, command "${command}" does not exists.`)

    return event.fn({ args })
  }

  /**
   * @name reset
   * @desc In order not to fock here, you need to initialize the properties
   */
  reset() {
    const property = ['hooksByPluginId', 'pluginMethods', 'plugins', 'commands']
    property.forEach((key) => {
      this[key] = {}
    })

    this.registerLifeCycle()
  }
}
