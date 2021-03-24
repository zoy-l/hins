import cloneDeep from 'lodash.clonedeep'
import uniq from 'lodash.uniq'
import assert from 'assert'
import path from 'path'

import { ICoreStage, CoreAttribute, ICoreApplyHookTypes, Cycle } from './enum'
import resolvePlugins, { pathToRegister } from './resolvePlugins'
import ReadConfig from './ReadConfig'
import AsyncHook from './AsyncHook'
import env from './env'
import Api from './Api'
import type {
  IConfigPlugins,
  ICoreApplyHook,
  ICoreStart,
  ICommands,
  INonEmpty,
  IWorkDir,
  IPlugin,
  IConfig,
  ICore,
  IHook,
  IMethods
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
  plugins: IPlugin[] = []

  /**
   * @desc list of plugins when registering,
   */
  extraPlugins: IPlugin[] = []

  /**
   * @desc initial Plugins
   */
  initPlugins: IPlugin[] = []

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
  isWatch: boolean

  /**
   * @name Core
   * @param { Function } options.babelRegister - provide config runtime. `type:Function`
   * @param { Array } options.possibleConfigName - config name path `type:string[]`
   * @param { Array } options.plugins Array - default plugin `type:string[]`
   * @param { boolean } options.isWatch - watch config `type:boolean`
   * @param { string } options.cwd - work path `type:string`
   */
  constructor(options: ICore) {
    this.isWatch = options.isWatch ?? true
    this.cwd = options.cwd ?? process.cwd()
    this.internalPlugins = options.plugins ?? []
    this.babelRegister = options.babelRegister ?? (() => {})

    this.configInstance = new ReadConfig({
      possibleConfigName: options.possibleConfigName ?? [],
      core: this
    })

    const cycle = new Api({ path: 'internal', core: this })

    Cycle.forEach((name) => {
      cycle.registerMethod({ name })
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
    this.babelRegister(uniq(this.initPlugins.map((plugin) => plugin.path)))

    env(path.join(this.cwd, '.env'))
  }

  async applyHooks(options: ICoreApplyHook) {
    const { add, modify, event } = this.ApplyHookType
    const { key, type, args, initialValue } = options

    if (type === add && initialValue !== undefined) {
      assert(
        Array.isArray(initialValue),
        'when ApplyHooksType is `add`, initialValue must be an array'
      )
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

      const api = new Proxy(new Api({ path, core: this }), {
        get: (target, prop: string) => {
          if (prop === 'config' && this.stage < ICoreStage.pluginReady) {
            console.warn(`Cannot get config before plugin registration`)
          }
          // the plugin Method has the highest weight,
          // followed by Service finally plugin API
          // Because pluginMethods needs to be available in the register phase
          // the latest updates must be obtained through the agent dynamics
          // to achieve the effect of registration and use
          return (
            this.pluginMethods[prop] ??
            (CoreAttribute.includes(prop)
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
      if (Array.isArray(rest) && rest.length) {
        rest.reverse().forEach((path) => {
          this.extraPlugins.unshift(pathToRegister(path))
        })
      }
    }

    this.setStage(ICoreStage.pluginReady)
    await this.applyHooks({
      key: 'onPluginReady',
      type: this.ApplyHookType.event
    })
  }

  async readyConfig() {
    // merge defaults
    // verify config value
    this.setStage(ICoreStage.getConfig)

    this.config = await this.applyHooks({
      key: 'modifyConfig',
      type: this.ApplyHookType.modify,
      initialValue: this.configInstance.getConfig()
    })

    this.configInstance.watchConfig()
  }

  /**
   * @name start
   * @param { string } options.args - other argument.
   * @param { string } options.command - command
   */
  async start(options: ICoreStart) {
    const { args, command } = options
    this.args = options

    this.init()

    await this.readyPlugins()

    await this.readyConfig()

    this.setStage(ICoreStage.run)
    await this.applyHooks({
      key: 'onStart',
      type: this.ApplyHookType.event,
      args: { args }
    })

    const event = this.commands[command]
    assert(event, `start command failed, command "${command}" does not exists.`)

    return event.fn({ args })
  }
}
