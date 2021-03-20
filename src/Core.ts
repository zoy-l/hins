import resolvePlugins, { pathToRegister } from '@/resolvePlugins'
import { AsyncSeriesWaterfallHook } from 'tapable'
import cloneDeep from 'lodash.clonedeep'
import ReadConfig from '@/ReadConfig'
import withEnv from '@/withEnv'
import uniq from 'lodash.uniq'
import events from 'events'
import assert from 'assert'
import path from 'path'
import Api from '@/Api'

import type {
  ICoreApplyHook,
  ICoreStart,
  ICommands,
  IWorkDir,
  IPlugin,
  IConfig,
  ICore,
  IHook,
  IConfigPlugins
} from '@/types'
import { ICoreStage, CoreAttribute, ICoreApplyHookTypes, Cycle } from '@/enum'

export default class Core extends events.EventEmitter {
  /**
   * @desc directory path
   */
  cwd: IWorkDir

  /**
   * @desc extra command
   */
  args?: Record<string, any>

  /**
   * @desc registered Plugins
   */
  plugins: IConfigPlugins = []

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
  pluginMethods: Record<string, { (...args: any[]): void }> = {}

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
   * @desc the final processed config
   */
  initConfig: IConfig

  /**
   * @desc the final processed config
   */
  config: IConfig = {}

  /**
   * @desc runtime babel
   */
  babelRegister: any

  /**
   * @desc Config Instance
   */
  configInstance: ReadConfig

  constructor(options: ICore) {
    super()

    this.cwd = options.cwd ?? process.cwd()

    this.configInstance = new ReadConfig({
      possibleConfigName: options.possibleConfigName ?? [],
      core: this
    })

    this.initConfig = this.configInstance.getUserConfig()

    withEnv(path.join(this.cwd, '.env'))

    this.initPlugins = resolvePlugins({
      cwd: this.cwd,
      plugins: options.plugins,
      userConfigPlugins: this.initConfig.plugins
    })

    this.babelRegister(uniq(this.initPlugins.map((plugin) => plugin.path)))

    const cycle = new Api({ path: 'internal', core: this })

    Cycle.forEach((name) => {
      cycle.registerMethod({ name })
    })
  }

  setStage(stage: ICoreStage) {
    this.stage = stage
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

    const waterFall = new AsyncSeriesWaterfallHook(['memo'])

    // Add hook method into the actuator
    // Prepare for later
    const apply = (func: (hook: IHook) => (memo: any[] | any) => Promise<any>) => {
      hooks.forEach((hook) => {
        waterFall.tapPromise(
          {
            name: hook.pluginId,
            stage: hook.stage ?? 0,
            before: hook.before
          },
          func(hook)
        )
      })
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

    return waterFall.promise(initialValue) as Promise<any>
  }

  async readyPlugins() {
    this.setStage(ICoreStage.init)
    const extraPlugins = cloneDeep(this.initPlugins)

    this.setStage(ICoreStage.initPlugins)
    while (extraPlugins.length) {
      const { path, apply } = extraPlugins.shift()!

      const api = new Proxy(new Api({ path, core: this }), {
        get: (target, prop: string) => {
          if (
            (prop === 'initConfig' || prop === 'config') &&
            this.stage < ICoreStage.pluginReady
          ) {
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
          extraPlugins.unshift(pathToRegister(path))
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
    const defaultConfig = await this.applyHooks({
      key: 'modifyDefaultConfig',
      type: this.ApplyHookType.modify,
      initialValue: this.configInstance.getDefaultConfig()
    })

    this.config = await this.applyHooks({
      key: 'modifyConfig',
      type: this.ApplyHookType.modify,
      initialValue: this.configInstance.getConfig(this.initConfig, defaultConfig)
    })
  }

  async start(options: ICoreStart) {
    const { args, command } = options
    this.args = args

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
