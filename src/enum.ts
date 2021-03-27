export enum ICoreStage {
  uninitialized,
  init,
  initPlugins,
  pluginReady,
  getConfig,
  start
}

export enum ICoreApplyHookTypes {
  add = 'add',
  modify = 'modify',
  event = 'event'
}

export const Cycle = <const>['onPluginReady', 'modifyPaths', 'modifyConfig', 'onStart']
