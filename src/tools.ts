import isPlainObject from 'lodash.isplainobject'
import isequal from 'lodash.isequal'
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

function funcString(value: typeof Function | Record<string, any>) {
  if (typeof value === 'function') return value.toString()
  if (isPlainObject(value)) {
    return Object.keys(value).reduce((memo, key) => {
      memo[key] = funcString(value[key])
      return memo
    }, {})
  }
  return value
}

export function isEqual(value: any, other: any) {
  return isequal(funcString(value), funcString(other))
}
