import AssetsPlugin from 'assets-webpack-plugin'
import chalk from 'chalk'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import fs from 'fs'
// import NyanProgressPlugin from 'nyan-progress-webpack-plugin'
import path from 'path'
import preconditions from 'preconditions'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import StatsPlugin from 'stats-webpack-plugin'
import webpack from 'webpack'

// let nyanProgressPlugin = new NyanProgressPlugin()
let progressBarPlugin = new ProgressBarPlugin({
  format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
  clear: false
})

class WebpackConfigurationFactory {
  constructor (options) {
    let pc = preconditions.instance(options)
    pc.shouldBeDefined('applicationName', 'applicationName is required.')
    pc.shouldBeDefined('applicationHost', 'applicationHost is required.')
    pc.shouldBeDefined('rootProjectPath', 'rootProjectPath is required.')
    pc.shouldBeDefined('rootApplicationPath', 'rootApplicationPath is required.')
    pc.shouldBeDefined('rootDeploymentPath', 'rootDeploymentPath is required.')
    pc.shouldBeDefined('rootDeploymentApplicationPath', 'rootDeploymentApplicationPath is required.')
    pc.shouldBeDefined('environment', 'environment is required.')
    pc.shouldBeDefined('locales', 'locales is required.')

    this._options = options
    this._applicationHost = options.applicationHost
    this._applicationName = options.applicationName
    this._rootProjectPath = options.rootProjectPath
    this._rootApplicationPath = options.rootApplicationPath
    this._rootDeploymentPath = options.rootDeploymentPath
    this._rootDeploymentApplicationPath = options.rootDeploymentApplicationPath
    this._environment = options.environment

    this._optimizers = {}
    this._initOptimizers()
  }

  _initOptimizers () {
    // this._optimizers.js = new HappyPack({
    //   id: 'js',
    //   threads: 4,
    //   loaders: [ 'babel-loader?compact=false' ]
    // })
    // 
    // this._optimizers.jsx = new HappyPack({
    //   id: 'jsx',
    //   threads: 4,
    //   loaders: this._environment === 'development'
    //     ? ['babel-loader?compact=false', 'react-hot-loader'] : ['babel-loader?compact=false']
    // })
  }

  createWebpackConfiguration () {
    let client = this._createClientWebpackConfiguration()
    let server = this._createServerWebpackConfiguration()
    let config = [server, client]
    return config
  }

  _createServerWebpackConfiguration () {
    let options = this._options
    let entry = this._buildServerEntry(options)
    let output = this._buildServerOutput(options)
    let plugins = this._buildServerPlugins(options)
    let common = this._buildCommon()

    let externalNodeModules = {}
    let nodeModulePath = path.join(this._rootProjectPath, 'node_modules')
    fs.readdirSync(nodeModulePath)
      .filter(function (x) {
        return ['.bin'].indexOf(x) === -1
      })
      .forEach(function (mod) {
        if (mod !== 'react-toolbox') {
          externalNodeModules[mod] = 'commonjs ' + mod
        }
      })

    return {
      name: 'server',
      ...common,
      entry: entry,
      output: output,
      plugins: plugins,
      target: 'node',
      devtool: 'sourcemap',
      externals: externalNodeModules
    }
  }

  _createClientWebpackConfiguration () {
    let options = this._options
    let entry = this._buildClientEntry(options)
    let output = this._buildClientOutput(options)
    let plugins = this._buildClientPlugins(options)
    let common = this._buildCommon()

    return {
      name: 'client',
      ...common,
      entry: entry,
      output: output,
      plugins: plugins
    }
  }

  _buildCommon () {
    let options = this._options
    let loaders = this._buildLoaders(options)
    let applicationNamespace = path.join(this._rootProjectPath, 'applications', options.applicationName)
    let frameworkNamespace = path.join(this._rootProjectPath, 'framework')
    let modulesDirectories = ['node_modules', frameworkNamespace, applicationNamespace]
    let extensions = ['', '.js', '.jsx', '.scss', '.css']
    let config = {
      module: {
        ...loaders
      },
      resolve: {
        modulesDirectories: modulesDirectories,
        extensions: extensions
      }
    }
    return config
  }

  _buildServerEntry (options) {
    let entry = {
      server: path.join(this._rootApplicationPath, 'server.jsx')
    }
    return entry
  }

  _buildClientEntry (options) {
    let environment = this._options.environment
    let clientEntry = []
    if (environment === 'development') {
      clientEntry.push('webpack-dev-server/client?http://localhost:' + this._options.devPort + '/')
      clientEntry.push('webpack/hot/only-dev-server')
    }
    clientEntry.push(path.join(this._rootApplicationPath, 'client.jsx'))
    let entry = {
      libs: [
        'react',
        'react-router'
      ],
      client: clientEntry
    }
    return entry
  }

  _buildClientOutput (options) {
    /*
     * You can use [hash] like: path.join(this._rootApplicationPath, 'build', '[hash]')
     * For now we will not use hash first, later on we will bring this to use when all is figured out
     */
    let output = {
      path: path.join(this._rootApplicationPath, 'build', this._environment, 'client'),
      publicPath: this._applicationHost + '/assets/',
      filename: 'main.js',
      chunkFilename: '[id].[name].js',
      sourceMapFilename: 'debugging/[file].map'
    }

    return output
  }

  _buildServerOutput (options) {
    /*
     * You can use [hash] like: path.join(this._rootApplicationPath, 'build', '[hash]')
     * For now we will not use hash first, later on we will bring this to use when all is figured out
     */
    let output = {
      path: path.join(this._rootApplicationPath, 'build', this._environment, 'server'),
      publicPath: this._applicationHost + '/assets/',
      filename: 'main.js',
      chunkFilename: '[id].[name].js',
      sourceMapFilename: 'debugging/[file].map'
    }

    return output
  }

  _buildLoaders (options) {
    var loaders = {
      'jsx': this._environment === 'development'
        ? ['react-hot-loader', 'babel-loader?compact=false'] : ['babel-loader?compact=false'],
      'js': 'babel-loader?compact=false',
      'json': 'json-loader',
      'json5': 'json5-loader',
      'txt': 'raw-loader',
      'png|jpg|jpeg|gif|svg': 'url-loader?limit=10000',
      'otf|woff|woff2': 'url-loader?limit=100000',
      'ttf|eot': 'file-loader',
      'wav|mp3': 'file-loader',
      'html': 'html-loader',
      'md|markdown': ['html-loader', 'markdown-loader']
    }

    var cssLoader = 'css-loader?module&localIdentName=[name]-[local]-[hash:base64:5]'

    var stylesheetLoaders = {
      'css': cssLoader,
      'less': [cssLoader, 'less-loader'],
      'styl': [cssLoader, 'stylus-loader'],
      'scss|sass': [cssLoader, 'sass-loader']
    }

    Object.keys(stylesheetLoaders).forEach(function (ext) {
      var stylesheetLoader = stylesheetLoaders[ext]
      if (Array.isArray(stylesheetLoader)) {
        stylesheetLoader = stylesheetLoader.join('!')
      }
      stylesheetLoaders[ext] = ExtractTextPlugin.extract('style-loader', stylesheetLoader)
    })

    let resultLoaders = []
      .concat(this._loadersByExtension(loaders))
      .concat(this._loadersByExtension(stylesheetLoaders))

    return {
      loaders: resultLoaders
    }
  }

  _buildServerPlugins (options) {
    let plugins = []
    // plugins.push(nyanProgressPlugin)

    plugins.push(progressBarPlugin)
    plugins.push(new StatsPlugin('stats.json', {
      chunkModules: true
    }))
    plugins.push(new webpack.optimize.DedupePlugin())
    plugins.push(new webpack.DefinePlugin(
      {
        '__PROJECT__': JSON.stringify(this._options),
        '__SERVER__': true,
        '__CLIENT__': false
      }
    ))
    plugins.push(new ExtractTextPlugin('styles.css'))
    plugins.push(new AssetsPlugin({
      prettyPrint: true,
      path: path.join(this._rootApplicationPath, 'build', this._environment, 'server'),
      update: true
    }))
    return plugins
  }

  _buildClientPlugins (options) {
    let project = {
      applicationName: this._options.applicationName,
      applicationHost: this._options.applicationHost,
      environment: this._options.environment,
      locales: this._options.locales
    }
    let plugins = []
    // plugins.push(nyanProgressPlugin)
    plugins.push(progressBarPlugin)

    if (this._options.environment === 'development') {
      plugins.push(new webpack.PrefetchPlugin('react'))
      plugins.push(new webpack.PrefetchPlugin('react-router'))
      plugins.push(new webpack.PrefetchPlugin('react/lib/ReactComponentBrowserEnvironment'))
      plugins.push(new webpack.HotModuleReplacementPlugin())
    }

    plugins.push(new StatsPlugin('stats.json', {
      chunkModules: true
    }))

    plugins.push(new webpack.optimize.CommonsChunkPlugin({
      name: 'libs',
      filename: 'commons.js',
      minChunks: 0
    }))

    if (this._options.environment !== 'development') {
      plugins.push(new webpack.optimize.UglifyJsPlugin(
        { compressor: { warnings: false } }
      ))
    }

    plugins.push(new webpack.optimize.DedupePlugin())
    plugins.push(new webpack.DefinePlugin(
      {
        'process.env': {
          'NODE_ENV': JSON.stringify(this._environment)
        },
        '__SERVER__': false,
        '__CLIENT__': true,
        '__PROJECT__': JSON.stringify(project)
      }))
    plugins.push(new webpack.NoErrorsPlugin())
    plugins.push(new ExtractTextPlugin('styles.css'))
    plugins.push(new AssetsPlugin({
      prettyPrint: true,
      path: path.join(this._rootApplicationPath, 'build', this._environment, 'client'),
      update: true
    }))
    return plugins
  }

  _extsToRegExp (exts) {
    return new RegExp('\\.(' + exts.map(function (ext) {
      return ext.replace(/\./g, '\\.')
    }).join('|') + ')(\\?.*)?$')
  }

  _loadersByExtension (obj) {
    let self = this
    var loaders = []
    Object.keys(obj).forEach(function (key) {
      var exts = key.split('|')
      var value = obj[key]
      var entry
      if (exts.indexOf('js') >= 0) {
        entry = {
          extensions: exts,
          exclude: /node_modules/,
          test: self._extsToRegExp(exts)
        }
      } else {
        entry = {
          extensions: exts,
          test: self._extsToRegExp(exts)
        }
      }

      if (Array.isArray(value)) {
        entry.loaders = value
      } else if (typeof value === 'string') {
        entry.loader = value
      } else {
        Object.keys(value).forEach(function (valueKey) {
          entry[valueKey] = value[valueKey]
        })
      }
      loaders.push(entry)
    })
    return loaders
  };
}

export default WebpackConfigurationFactory
