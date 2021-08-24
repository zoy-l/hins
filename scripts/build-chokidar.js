const path = require('path')

module.exports = {
  target: 'node',
  mode: 'production',
  entry: require.resolve('chokidar'),
  // devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'chokidar.js',
    libraryTarget: 'commonjs'
  },
  externals: {
    fsevents: 'fsevents'
  }
}
