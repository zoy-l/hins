import isplainobject from 'lodash.isplainobject'
import clonedeep from 'lodash.clonedeep'
import clearModule from 'clear-module'
import isEqual from 'lodash.isequal'
import merge from 'lodash.merge'
import chokidar from 'chokidar'
import uniq from 'lodash.uniq'
import resolve from 'resolve'
import slash from 'slash'
import chalk from 'chalk'
import joi from 'joi'

import Core from './Core'
import { IApi } from './types'

export {
  isplainobject,
  clearModule,
  clonedeep,
  chokidar,
  resolve,
  isEqual,
  merge,
  slash,
  chalk,
  Core,
  IApi,
  uniq,
  joi
}
