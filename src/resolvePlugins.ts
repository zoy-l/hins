import resolve from 'resolve'
import assert from 'assert'
import slash from 'slash'
import fs from 'fs'

import { compatESModuleRequire, flatDeep } from './tools'
import { IResolvePlugins } from './types'

export function pathToRegister(path: string) {
  assert(fs.existsSync(path), `${path} not exists, pathToRegister failed`)

  return {
    path: slash(path),
    apply() {
      try {
        return compatESModuleRequire(require(path))
      } catch (err) {
        throw new Error(`Register plugin ${path} failed, since ${err.message}`)
      }
    }
  }
}

export default function resolvePlugins(options: IResolvePlugins) {
  const plugins = flatDeep(
    [options.plugins, options.userConfigPlugins].filter(Boolean)
  ).map((path) =>
    resolve.sync(path, {
      basedir: options.cwd,
      extensions: ['.js', '.ts']
    })
  )

  return plugins.map(pathToRegister)
}
