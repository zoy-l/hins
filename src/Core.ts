import resolvePlugins, { pathToRegister } from '@/resolvePlugins'
import BabelRegister from '@/BabelRegister'
import cloneDeep from 'lodash.clonedeep'
import ReadConfig from '@/ReadConfig'
import withEnv from '@/withEnv'
import uniq from 'lodash.uniq'
import events from 'events'
import assert from 'assert'
import path from 'path'
import Api from '@/Api'

import type {
  IPlugin,
  IConfig,
  ICore,
  IWorkDir,
  ICoreStart,
  IHook,
  ICommands
} from '@/types'
import { ICoreStage, CoreAttribute } from '@/enum'

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
  plugins: IPlugin | [] = []

  /**
   * @desc initial config
   */
  initConfig: IConfig

  /**
   * @desc initial Plugins
   */
  initPlugins: IPlugin[] = []

  /**
   * @desc registered commands
   */
  commands: Record<string, ICommands> = {}

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
  // finallyConfig: IConfig

  /**
   * @desc runtime babel
   */
  babelRegister = new BabelRegister()

  /**
   * @desc Config Instance
   */
  configInstance: ReadConfig

  constructor(options: ICore) {
    super()
    assert(options.possibleConfigPaths, `'possibleConfigPaths' is required`)
    this.cwd = options.cwd ?? process.cwd()

    this.configInstance = new ReadConfig({
      possibleConfigPaths: options.possibleConfigPaths,
      core: this
    })

    this.initConfig = this.configInstance.getUserConfig()

    withEnv(path.join(this.cwd, '.env'))

    this.initPlugins = resolvePlugins({
      cwd: this.cwd,
      plugins: options.plugins,
      userConfigPlugins: this.initConfig.plugins
    })

    this.babelRegister.setOnlyMap({
      key: 'initPlugins',
      value: uniq(this.initPlugins.map((plugin) => plugin.path))
    })
  }

  setStage(stage: ICoreStage) {
    this.stage = stage
  }

  async readyPlugins() {
    this.setStage(ICoreStage.init)
    const extraPlugins = cloneDeep(this.initPlugins)

    this.setStage(ICoreStage.initPlugins)
    while (extraPlugins.length) {
      const { path, apply } = extraPlugins.shift()!

      const api = new Proxy(new Api({ path, core: this }), {
        get: (target, prop: string) =>
          // the plugin Method has the highest weight,
          // followed by Service finally plugin API
          // Because pluginMethods needs to be available in the register phase
          // the latest updates must be obtained through the agent dynamics
          // to achieve the effect of registration and use
          this.pluginMethods[prop] ??
          (CoreAttribute.includes(prop)
            ? typeof this[prop] === 'function'
              ? this[prop].bind(this)
              : this[prop]
            : target[prop])
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
    // await this.applyPlugins({
    //   key: 'onPluginReady',
    //   type: this.ApplyPluginsType.event
    // })
  }

  async readyConfig() {
    //
  }

  async start(options: ICoreStart) {
    const { args, command } = options
    this.args = args

    console.log(command)

    await this.readyPlugins()

    await this.readyConfig()
  }
}
