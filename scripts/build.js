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

Promise.all([buildBundle, buildJoi]).then(() => {
  console.log(chalk.cyan(`Build introduce joi`))
  const cwd = path.join(__dirname, '../dist/index.js')

  const file = fs.readFileSync(cwd, 'utf-8')

  fs.writeFileSync(
    cwd,
    file.toString().replace(`require('joi')`, `require('./joi')`),
    'utf-8'
  )
  console.log(chalk.green(`Build completed`))
})
