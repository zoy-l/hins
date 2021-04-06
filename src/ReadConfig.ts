import clearModule from 'clear-module'
import chokidar from 'chokidar'
import assert from 'assert'
import slash from 'slash'
import path from 'path'
import Joi from 'joi'
import fs from 'fs'

import { compatESModuleRequire, isEqual, mergeDefault } from './tools'
import { ICoreStage } from './enum'

import type { IConfig, IReadConfig, IWorkDir } from './types'

export default class Config {
  /**
   * @desc possible Config name
   */
  possibleConfigName: IWorkDir[]

  /**
   * @desc Service instance
   */
  core: IReadConfig['core']

  constructor(options: IReadConfig) {
    this.core = options.core
    this.possibleConfigName = options.possibleConfigName
  }

  getConfig(userConfig: IConfig) {
    const defaultConfig = this.getDefaultConfig()

    const { stage, plugins } = this.core

    assert(
      stage >= ICoreStage.pluginReady,
      `Config.getConfig() failed, it should not be executed before plugin is ready.`
    )

    const userConfigKeys = Object.keys(userConfig)
    const keepKeys = {}

    // get config
    Object.keys(plugins).forEach((plugin) => {
      const { key, config } = plugins[plugin]

      if (!key || !config) {
        return
      }

      const value = userConfig[key]

      if (!keepKeys[key]) {
        keepKeys[key] = key
      } else {
        throw new Error(`have multiple same ${key}`)
      }

      const schema = config.schema(Joi)
      assert(
        Joi.isSchema(schema),
        `schema return from plugin ${plugin} is not valid schema.`
      )
      const { error } = schema.validate(value)

      if (error) {
        throw new Error(error.message)
      }

      // All the configurable key values are obtained above
      // and the verification process is performed here.
      // If all the key values are filled in
      // the length of `userConfigKeys` should be `0`
      const index = userConfigKeys.indexOf(key.split('.')[0])
      if (index !== -1) {
        userConfigKeys.splice(index, 1)
      }

      // update userConfig with defaultConfig
      if (key in defaultConfig) {
        const newValue = mergeDefault({
          defaultConfig: defaultConfig[key],
          config: value
        })
        userConfig[key] = newValue
      }
    })

    // Same as above, if the value of `userConfigKeys` is not 0,
    // an error is thrown here and prompts which keys are illegal
    if (userConfigKeys.length) {
      const keys = userConfigKeys.length > 1 ? 'keys' : 'key'
      throw new Error(`Invalid config ${keys}: ${userConfigKeys.join(', ')}`)
    }

    return userConfig
  }

  getDefaultConfig() {
    const { plugins } = this.core

    // collect default config
    return Object.keys(plugins).reduce((memo, pluginId) => {
      const { key, config } = plugins[pluginId]

      if (!key || !config) return memo

      if ('default' in config) memo[key] = config.default
      return memo
    }, {})
  }

  getConfigFile() {
    const { cwd } = this.core
    const env = process.env.HINS_CONFIG_ENV
    // Get a valid file name
    // I.e. check if the file exists
    let configFile = this.possibleConfigName.find((file) =>
      fs.existsSync(path.join(cwd, file))
    )

    if (configFile) {
      if (env) {
        const ext = path.extname(configFile)
        configFile = configFile.replace(ext, `.${env}${ext}`)
      }

      return slash(path.join(cwd, configFile))
    }

    return false
  }

  getUserConfig(): IConfig {
    const { babelRegister } = this.core
    const configFile = this.getConfigFile()

    if (configFile) {
      // clear the require cache
      // load babelRegister if there is
      clearModule(configFile)
      babelRegister(configFile)

      return compatESModuleRequire(require(configFile))
    }

    return {}
  }

  watchConfig() {
    const { cwd, config, args, watchConfig } = this.core

    const configFile = this.getConfigFile()

    if (configFile) {
      const watcher = chokidar.watch(configFile, {
        cwd,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 500
        }
      })

      watcher.on('all', async (event, paths) => {
        watchConfig?.changeLog(event, paths)
        const newConfig = this.getConfig(this.getUserConfig())

        if (!isEqual(newConfig, config)) {
          await watcher.close()
          this.core.start(args!)
          watchConfig?.reloadLog(event, paths)
        }
      })
    }
  }
}
