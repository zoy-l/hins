import isplainobject from 'lodash.isplainobject'
import clonedeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'
import merge from 'lodash.merge'
import chokidar from 'chokidar'
import uniq from 'lodash.uniq'
import resolve from 'resolve'
import slash from 'slash'
import joi from 'joi'

import Core from './Core'

export * from './types'
export {
  isplainobject,
  clonedeep,
  chokidar,
  resolve,
  isEqual,
  merge,
  slash,
  Core,
  uniq,
  joi
}
