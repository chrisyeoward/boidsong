const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: "./main.js",
  output: {
      path: __dirname,
      filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          /(node_modules)/,
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  optimization: {
    minimizer: [new UglifyJsPlugin({
      include: ["p5.min.js"],
    })]
  }
};
