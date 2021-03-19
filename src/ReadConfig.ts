import { IConfig, IReadConfig, IWorkDir } from '@/types'
import { compatESModuleRequire } from '@/tools'

import slash from 'slash'
import path from 'path'
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

  getDefaultConfig() {
    const { plugins } = this.core
    const pluginIds = Object.keys(plugins)

    // collect default config
    return pluginIds.reduce((memo, pluginId) => {
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
