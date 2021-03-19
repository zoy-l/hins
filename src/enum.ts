export enum ICoreStage {
  uninitialized,
  init,
  initPlugins,
  pluginReady,
  getConfig,
  getPaths,
  run
}

export enum ICoreApplyPluginTypes {
  add = 'add',
  modify = 'modify',
  event = 'event'
}

export const CoreAttribute = [
  'ApplyPluginsType',
  'babelRegister',
  'finallyConfig',
  'applyPlugins',
  'initConifg',
  'hasPlugins',
  'coreStage',
  'paths',
  'stage',
  'args',
  'env',
  'cwd'
]

export const Cycle = [
  'onPluginReady',
  'modifyPaths',
  'onStart',
  'modifyDefaultConfig',
  'modifyConfig'
]
