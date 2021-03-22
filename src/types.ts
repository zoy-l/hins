import { Root, Schema } from 'joi'

import { ICoreApplyHookTypes } from './enum'
import Core from './Core'

/**
 * @desc Current working directory
 */
export type IWorkDir = string

/**
 * @desc Current parameter
 */
export type IArgs = Record<string, any>

/**
 * @desc Plugins that need to be registered
 */
export type IConfigPlugins = string[]

/**
 * @desc Tool type, change the object type to mandatory
 */
export type INonEmpty<T extends Record<string, any>> = {
  [key in keyof T]-?: T[key]
}

/**
 * @desc Generally refers to the plugin method
 */
export type IMethods = { (...args: any[]): any | Promise<any> }

/**
 * @desc Specific execution hook object
 */
export interface IHook {
  pluginId: string
  before?: string
  stage?: number
  fn: IMethods
  key: string
}

/**
 * @desc Registered command object
 */
export interface ICommands {
  command: string
  description?: string
  fn: { (args: IArgs): any }
}

/**
 * @desc Parameters received by the ResolvePlugins method
 */
export interface IResolvePlugins {
  cwd: IWorkDir
  plugins?: IConfigPlugins
  userConfigPlugins?: IConfigPlugins
}

/**
 * @desc Parameters of the ReadConfig constructor
 */
export interface IReadConfig {
  possibleConfigName: IWorkDir[]
  core: Core
}

/**
 * @desc The default object structure of config
 */
export interface IConfig {
  [key: string]: any
}

/**
 * @desc Registered plug-in object
 */
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
 * @desc Core constructor type
 */
export interface ICore {
  babelRegister?: (path: string | string[]) => void
  possibleConfigName?: IWorkDir[]
  plugins?: IConfigPlugins
  isWatch?: boolean
  cwd?: IWorkDir
}

/**
 * @desc Core start method type
 */
export interface ICoreStart {
  args?: IArgs
  command: string
}

/**
 * @desc Core ApplyHook method type
 */
export interface ICoreApplyHook {
  type: ICoreApplyHookTypes
  initialValue?: any
  key: string
  args?: IArgs
}

/**
 * @desc Api constructor type
 */
export interface IApi {
  core: Core
  path: string
}

/**
 * @desc Api describe method type
 */
export interface IApiDescribe {
  key: string
  config: {
    default?: any
    schema: {
      (joi: Root): Schema
    }
  }
}

/**
 * @desc Api RegisterMethod method type
 */
export interface IApiRegisterMethod {
  name: string
  description?: string
  fn?: IMethods
}
