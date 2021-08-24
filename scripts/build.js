const { exec } = require('child_process')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

const buildJoi = new Promise((rs, rj) => {
  console.log(chalk.cyan(`start Build joi`))
  exec('yarn run build-joi', (err) => {
    if (err) {
      console.log(err)
      rj(err)
    } else {
      rs()
      console.log(chalk.green(`Build joi completed`))
    }
  })
})

const buildResolve = new Promise((rs, rj) => {
  console.log(chalk.cyan(`start Build resolve`))
  exec('yarn run build-resolve', (err) => {
    if (err) {
      console.log(err)
      rj(err)
    } else {
      rs()
      console.log(chalk.green(`Build resolve completed`))
    }
  })
})

const buildBundle = new Promise((rs, rj) => {
  console.log(chalk.cyan(`start Build bundle`))
  exec('yarn run build-bundle', (err) => {
    if (err) {
      console.log(err)
      rj(err)
    } else {
      rs()
      console.log(chalk.green(`Build bundle`))
    }
  })
})

Promise.all([buildBundle, buildJoi, buildResolve]).then(() => {
  console.log(chalk.cyan(`Build introduce joi`))
  const cwd = (paths) => path.join(__dirname, paths)

  const file = fs.readFileSync(cwd('../dist/index.js'), 'utf-8')
  const type = fs.readFileSync(cwd('../dist/index.d.ts'), 'utf-8')

  fs.writeFileSync(
    cwd('../dist/index.js'),
    file
      .toString()
      .replace(/require\(("|')joi("|')\)/, `require("./joi")`)
      .replace(/require\(("|')resolve("|')\)/, `require("./resolve")`),
    'utf-8'
  )

  fs.writeFileSync(
    cwd('../dist/index.d.ts'),
    type.toString() +
      `
declare function clonedeep<T>(value: T): T
declare function isplainobject(value?: any): boolean
declare function uniq(array: any[] | null | undefined): any[]
declare function isEqual(arg0: any, arg1: any): boolean
declare function merge<T, U>(
  arg0: T,
  arg1: U
): T extends Record<string, any> ? (U extends Record<string, any> ? T & U : never) : never
      `,
    'utf-8'
  )
  console.log(chalk.green(`Build completed`))
})
