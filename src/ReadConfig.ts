import { compatESModuleRequire, mergeDefault } from '@/tools'
import type { IConfig, IReadConfig, IWorkDir } from '@/types'
import { ICoreStage } from '@/enum'
import assert from 'assert'
import slash from 'slash'
import path from 'path'
import Joi from 'joi'
import fs from 'fs'

export default class Config {
  possibleConfigPaths: IWorkDir[]

  /**
   * @desc Service instance
   */
  core: IReadConfig['core']

  constructor(options: IReadConfig) {
    this.core = options.core
    this.possibleConfigPaths = options.possibleConfigPaths
  }

  getConfig(userConfig: IConfig, defaultConfig: Record<string, any>) {
    const { stage, plugins } = this.core

    assert(
      stage >= ICoreStage.pluginReady,
      `Config.getConfig() failed, it should not be executed before plugin is ready.`
    )

    const userConfigKeys = Object.keys(userConfig).filter(
      (key) => userConfig[key] !== false
    )

    const keepKeys = {}
    // get config
    Object.keys(plugins).forEach((pluginId) => {
      const { key, config = {} } = plugins[pluginId]
      const value = userConfig[key]

      if (!keepKeys[key]) {
        keepKeys[key] = key
      } else {
        throw new Error(`have multiple same ${key}`)
      }

      // recognize as key if have `schema` config
      // disabled when `value` is false
      if (!config.schema || value === false) return

      const schema = config.schema(Joi)
      assert(
        Joi.isSchema(schema),
        `schema return from plugin ${pluginId} is not valid schema.`
      )
      const { error } = schema.validate(value)

      if (error) {
        throw new Error(error.message)
      }

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
      const { key, config = {} } = plugins[pluginId]
      if ('default' in config) memo[key] = config.default
      return memo
    }, {})
  }

  getConfigFile() {
    const { cwd } = this.core
    const configFile = this.possibleConfigPaths.find((file) =>
      fs.existsSync(path.join(cwd, file))
    )
    return configFile ? slash(configFile) : undefined
  }

  getUserConfig(): IConfig {
    const { cwd, babelRegister } = this.core
    const configFile = this.getConfigFile()

    if (configFile) {
      const real = path.join(cwd, configFile)

      babelRegister.setOnlyMap({
        key: 'config',
        value: [real]
      })

      return { ...compatESModuleRequire(require(real)) }
    }

    return {}
  }
}
