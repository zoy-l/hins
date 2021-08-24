const path = require('path')

module.exports = {
  target: 'node',
  mode: 'production',
  entry: require.resolve('resolve'),
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'resolve.js',
    libraryTarget: 'commonjs'
  }
}
