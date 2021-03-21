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
  uniq,
  joi
}

type clonedeep = <T>(value: T) => T

type isplainobject = (value?: any) => boolean

type uniq = (array: any[] | null | undefined) => any[]

type isEqual = (arg0: any, arg1: any) => boolean

type merge = <T, U>(
  arg0: T,
  arg1: U
) => T extends Record<string, any>
  ? U extends Record<string, any>
    ? T & U
    : never
  : never
