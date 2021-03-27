const fs = require('fs')
const path = require('path')
const { exec, execSync } = require('child_process')
const { prettier } = require('eslint-config-zmi')

const pkg = require('../package.json')

const { version } = pkg
let isOne = false

const newVersion = [...version]
  .reverse()
  .map((s) => {
    if (!Number.isNaN(Number(s)) && !isOne) {
      s = Number(s) + 1
      isOne = true
    }
    return s
  })
  .reverse()
  .join('')

pkg.version = newVersion

fs.writeFileSync(
  path.join(__dirname, '../package.json'),
  prettier.format(JSON.stringify(pkg), {
    parser: 'json',
    printWidth: 20
  }),
  'utf-8'
)

execSync('npm run build')

exec('npm publish', (err, stdout, stderr) => {
  if (err) {
    console.log(err)
  } else {
    console.log(stdout)
    console.log(stderr)
  }
})
