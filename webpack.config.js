require('babel-polyfill');

const webpack = require('webpack');
const path = require('path');
const glob = require('glob');
const extractTextPlugin = require('extract-text-webpack-plugin');
const htmlWebpackPlugin = require('html-webpack-plugin');
const cleanWebpackPlugin = require('clean-webpack-plugin');
const autoPrefixer = require('autoprefixer');

const isDev = (process.env.NODE_ENV === 'development') ? true : false;
const basePath = process.cwd();

const nunjucksContext = require('./resources/data/index');
const nunjucksDevConfig = require('./resources/html/config.dev.json');
const nunjucksProdConfig = require('./resources/html/config.prod.json');

nunjucksContext.config = (isDev) ? nunjucksDevConfig : nunjucksProdConfig;

const nunjucksOptions = JSON.stringify({
  searchPaths: basePath + '/resources/html/',
  context: nunjucksContext
});

const pages = glob.sync('**/*.njk', {
  cwd: path.join(basePath, 'resources/html/pages/'),
  root: '/',
}).map(page => new htmlWebpackPlugin({
  filename: page.replace('njk', 'html'),
  template: `resources/html/pages/${page}`,
}));


module.exports = {
  entry: {
    app: [
      'babel-polyfill',
      './resources/assets/js/index.js',
      './resources/assets/scss/main.scss'
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
          emitError: true,
          emitWarning: true
        },
        enforce: 'pre'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.s[ac]ss/,
        use: extractTextPlugin.extract({
          use: [
            { 
              loader: "css-loader?url:false"
            },
            {
              loader: "postcss-loader"
            },
            {
              loader: "sass-loader"
            }
          ],
          fallback: "style-loader"
        })
      },
      {
        test: /\.(njk|nunjucks)$/,
        loader: ['html-loader', `nunjucks-html-loader?${nunjucksOptions}`]
      },
      {
        test: /\.(jpe?g|png|svg|gif)$/,
        loader: 'file-loader',
        options: {
          name: (isDev) ? '[name].[ext]' : 'assets/images/[name].[hash:8].[ext]'
        }
      }
    ]
  },
  output: {
    path: basePath + '/dist',
    filename: 'assets/js/bundle.js'
  },
  plugins: [
    ...pages,
    new extractTextPlugin('assets/css/main.css')
  ],
  devServer: {
    contentBase: basePath + '/resources',
    hot: true,
    open: true,
    watchContentBase: true
  }
}

if (!isDev) {
  module.exports.plugins.push(
    new cleanWebpackPlugin(['dist']),
    new webpack.optimize.UglifyJsPlugin()
  )
}