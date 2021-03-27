import { Root, Schema } from 'joi'

import { ICoreApplyHookTypes, Cycle } from './enum'
import Core from './Core'
import Api from './Api'

type IUserValue = any
/**
 * @desc Current working directory
 */

export type IWorkDir = string

/**
 * @desc Current parameter
 */
export type IArgs = Record<string, IUserValue>

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
export type IMethods = { (...args: any[]): IUserValue | Promise<IUserValue> }

/**
 * @desc Specific execution hook common object
 */
interface IHookCommon {
  before?: string | string[]
  stage?: number
  fn: IMethods
}

/**
 * @desc Specific execution hook object
 */
export interface IHook extends IHookCommon {
  pluginId: string
  key: string
}

/**
 * @desc Hook internal parameters
 */
export interface IAsyncHook extends IHookCommon {
  name: string
}

/**
 * @desc Registered command object
 */
export interface ICommands {
  command: string
  alias?: string
  description?: string
  fn: { (args: IArgs): IUserValue }
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
  [key: string]: IUserValue
}

/**
 * @desc Registered plug-in object
 */
export interface IPlugin {
  path: string
  key?: string
  apply: {
    (): (
      api: IApiOpitons
    ) =>
      | undefined
      | { plugins: IConfigPlugins }
      | Promise<undefined | { plugins: IConfigPlugins }>
  }
  config?: {
    default?: IUserValue
    schema: {
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
  reloadCommand?: boolean
}

/**
 * @desc Core ApplyHook method type
 */
export interface ICoreApplyHook {
  type: ICoreApplyHookTypes
  initialValue?: IUserValue
  key: string
  args?: IArgs
}

/**
 * @desc Api constructor type
 */
export interface IApiOpitons {
  core: Core
  path: string
}

/**
 * @desc Exposed to the outside
 */
export type IApi = Core & Omit<Api, 'core'> & { [key in typeof Cycle[number]]: IMethods }

/**
 * @desc Api describe method type
 */
export interface IApiDescribe {
  key: string
  config: {
    default?: IUserValue
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

export interface ITypeHooks {
  (options: Omit<ICoreApplyHook, 'type'>): Promise<IUserValue>
}
