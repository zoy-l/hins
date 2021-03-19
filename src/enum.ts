export enum ICoreStage {
  uninitialized,
  init,
  initPlugins,
  pluginReady,
  getConfig,
  getPaths,
  run
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
