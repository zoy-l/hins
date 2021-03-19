import isPlainObject from 'lodash.isplainobject'
import merge from 'lodash.merge'

// Compatible processing
export function flatDeep(arr: any[], container: any[] = []) {
  arr.forEach((item) => {
    if (Array.isArray(item)) {
      flatDeep(item, container)
    } else {
      container.push(item)
    }
  })
  return container
}

export function compatESModuleRequire<T extends { __esModule: boolean; default: any }>(
  m: T
): T extends { __esModule: true; default: infer U } ? U : T {
  return m.__esModule ? m.default : m
}

export function mergeDefault({ defaultConfig, config }: Record<string, any>) {
  if (isPlainObject(defaultConfig) && isPlainObject(config)) {
    return merge(defaultConfig, config)
  }
  return typeof config !== 'undefined' ? config : defaultConfig
}
