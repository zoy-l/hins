import { Root, Schema } from 'joi'

import { ICoreApplyHookTypes, Cycle } from './enum'
import Core from './Core'
import Api from './Api'

/**
 * @desc Any key value
 */
type IKey = string

/**
 * @desc Any type entered on behalf of the user
 */
type IUserValue = any

/**
 * @desc Current working directory
 */
export type IWorkDir = string
// The above just increases readability

/**
 * @desc Current parameter
 */
export type IArgs = Record<string, IUserValue>

/**
 * @desc Plugins that need to be registered
 */
export type IConfigPlugins = string[]

/**
 * @desc chokidar change types
 */
export type IChangeTypes = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir'

/**
 * @desc plugin config
 */
export type IPluginConfig = {
  default?: IUserValue
  schema: {
    (joi: Root): Schema
  }
}

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
  key: IKey
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
  fn: { (args: IArgs): IUserValue }
  description?: string
  command: string
  alias?: string
}

/**
 * @desc Parameters received by the ResolvePlugins method
 */
export interface IResolvePlugins {
  plugins: IConfigPlugins
  cwd: IWorkDir
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
 * @desc Plugin to be executed
 */
export interface IApplyPlugin {
  path: IWorkDir
  apply: {
    (): (
      api: IApiOpitons
    ) =>
      | undefined
      | { plugins: IConfigPlugins }
      | Promise<undefined | { plugins: IConfigPlugins }>
  }
}

/**
 * @desc Registered plug-in object
 */
export interface IPlugin extends IApplyPlugin {
  config?: IPluginConfig
  key?: IKey
}

/**
 * @desc Core constructor type
 */
export interface ICore {
  babelRegister?: (path: IWorkDir | IWorkDir[]) => void
  possibleConfigName?: IWorkDir[]
  plugins?: IConfigPlugins
  cwd?: IWorkDir
  watchConfig?: {
    changeLog: (type: IChangeTypes, path: string, isReload: boolean) => void
    reloadLog: (type: IChangeTypes, path: string) => void
  }
}

/**
 * @desc Core start method type
 */
export interface ICoreStart {
  reloadCommand?: boolean
  command: string
  args?: IArgs
}

/**
 * @desc Core ApplyHook method type
 */
export interface ICoreApplyHook {
  type: ICoreApplyHookTypes
  initialValue?: IUserValue
  args?: IArgs
  key: IKey
}

/**
 * @desc Api constructor type
 */
export interface IApiOpitons {
  path: IWorkDir
  core: Core
}

/**
 * @desc Exposed to the outside
 */
export type Hins = Core & Api & { [key in typeof Cycle[number]]: IMethods }

/**
 * @desc Api describe method type
 */
export interface IApiDescribe {
  config: IPluginConfig
  key: IKey
}

/**
 * @desc Api registerPlugins options
 */
export type IApiRegisterPlugins = (
  | IWorkDir
  | {
      key: IKey
      apply: (
        api: Hins
      ) =>
        | undefined
        | { plugins: IConfigPlugins }
        | Promise<undefined | { plugins: IConfigPlugins }>
    }
)[]

/**
 * @desc Api RegisterMethod method type
 */
export interface IApiRegisterMethod {
  fn?: IMethods
  name: string
}

/**
 * @desc applyHook convenience method
 */
export interface ITypeHooks {
  (options: Omit<ICoreApplyHook, 'type'>): Promise<IUserValue>
}
