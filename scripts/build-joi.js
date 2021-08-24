const path = require('path')

module.exports = {
  target: 'node',
  mode: 'production',
  entry: require.resolve('joi'),
  // devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'joi.js',
    libraryTarget: 'commonjs'
  }
}
