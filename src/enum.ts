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

export const CoreAttribute = <const>[
  'applyModifyHooks',
  'applyEventHooks',
  'applyAddHooks',
  'ApplyHookType',
  'babelRegister',
  'applyHooks',
  'coreStage',
  'config',
  'stage',
  'args',
  'cwd'
]

export const Cycle = <const>['onPluginReady', 'modifyPaths', 'modifyConfig', 'onStart']
