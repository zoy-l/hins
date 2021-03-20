export enum ICoreStage {
  uninitialized,
  init,
  initPlugins,
  pluginReady,
  getConfig,
  getPaths,
  run
}

export enum ICoreApplyHookTypes {
  add = 'add',
  modify = 'modify',
  event = 'event'
}

export const CoreAttribute = [
  'ApplyPluginsType',
  'babelRegister',
  'applyPlugins',
  'initConfig',
  'hasPlugins',
  'coreStage',
  'config',
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
