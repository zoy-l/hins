import { Root, Schema } from 'joi'

import { ICoreApplyHookTypes } from './enum'
import Core from './Core'

export type IWorkDir = string

export type IArgs = Record<string, any>

export type IConfigPlugins = string[]

export type INonEmpty<T extends Record<string, any>> = {
  [key in keyof T]-?: T[key]
}

export type IMethods = { (...args: any[]): any | Promise<any> }

export interface IHook {
  pluginId: string
  before?: string
  stage?: number
  fn: IMethods
  key: string
}

export interface ICommands {
  command: string
  description?: string
  fn: { (args: IArgs): any }
}

export interface IResolvePlugins {
  cwd: IWorkDir
  plugins?: IConfigPlugins
  userConfigPlugins?: IConfigPlugins
}

export interface IReadConfig {
  possibleConfigName: IWorkDir[]
  core: Core
}

export interface IConfig {
  plugins?: IConfigPlugins
  [key: string]: any
}

export interface IPlugin {
  path: string
  key?: string
  apply: {
    (): (api: IApi) => undefined | IConfigPlugins | Promise<undefined | IConfigPlugins>
  }
  config?: {
    default?: any
    schema?: {
      (joi: Root): Schema
    }
  }
}

/**
 * @desc Server type
 */

export interface ICore {
  babelRegister?: (path: string | string[]) => void
  possibleConfigName?: IWorkDir[]
  plugins?: IConfigPlugins
  isWatch?: boolean
  cwd?: IWorkDir
}

export interface ICoreStart {
  args?: IArgs
  command: string
}

export interface ICoreApplyHook {
  type: ICoreApplyHookTypes
  initialValue?: any
  key: string
  args?: IArgs
}

/**
 * @desc Api type
 */

export interface IApi {
  core: Core
  path: string
}

export interface IApiDescribe {
  key: string
  config: {
    default?: any
    schema: {
      (joi: Root): Schema
    }
  }
}

export interface IApiRegisterMethod {
  name: string
  description?: string
  fn?: IMethods
}
