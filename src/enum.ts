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
  'ApplyHookType',
  'babelRegister',
  'applyHooks',
  'coreStage',
  'config',
  'paths',
  'stage',
  'args',
  'cwd'
]

export const Cycle = ['onPluginReady', 'modifyPaths', 'modifyConfig', 'onStart']
