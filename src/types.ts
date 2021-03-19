import { Root, Schema } from 'joi'
import Core from '@/Core'

export type IWorkDir = string

export type IArgs = Record<string, any>

export type IConfigPlugins = string[]

export interface IHook {
  fn: { (...args: any[]): void | Promise<void> }
  pluginId?: string
  before?: string
  stage?: number
  key: string
}

export interface ICommands {
  command: string
  description?: string
  fn: { (args: IArgs): void }
}

export interface IResolvePlugins {
  cwd: IWorkDir
  plugins?: IConfigPlugins
  userConfigPlugins?: IConfigPlugins
}

export interface IReadConfig {
  possibleConfigPaths: IWorkDir[]
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
  possibleConfigPaths: IWorkDir[]
  plugins?: IConfigPlugins
  cwd?: IWorkDir
}

export interface ICoreStart {
  args?: IArgs
  command: string
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
  fn?: { (...args: any[]): void }
}
