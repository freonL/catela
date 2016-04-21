import path from 'path'
import preconditions from 'preconditions'
import webpack from 'webpack'
import WebpackConfigurationFactory from 'webpack/WebpackConfigurationFactory'
import WebpackDevServer from 'webpack-dev-server'

class UniversalWebApplicationSetup {
  static create (options) {
    return new UniversalWebApplicationSetup(options)
  }

  constructor (options) {
    let pc = preconditions.instance(options)
    pc.shouldBeDefined('name', 'Please provide the name of the application.')
    pc.shouldBeDefined('host', 'Please provide the host of the application.')
    pc.shouldBeDefined('port', 'Please provide the port of the application.')
    pc.shouldBeDefined('pingPort', 'Please provide the ping port of the application.')
    pc.shouldBeDefined('rootProjectPath', 'Please provide the rootProjectPath.')
    pc.shouldBeDefined('rootDeploymentPath', 'Please provide the rootDeploymentPath.')
    pc.shouldBeDefined('environment', 'Please provide the environment.')

    console.log('Application is initializing - ', options.name)

    this._options = options

    this._applicationName = options.name
    this._applicationHost = options.host

    var rootProjectPath = options.rootProjectPath
    var rootApplicationPath = path.join(options.rootProjectPath, 'applications', options.name)

    var rootDeploymentPath = options.rootDeploymentPath
    var rootDeploymentApplicationPath = path.join(options.rootDeploymentPath, 'applications', options.name)

    console.log('==> rootProjectPath: ', rootProjectPath)
    console.log('==> rootApplicationPath: ', rootApplicationPath)
    console.log('==> rootDeploymentPath: ', rootDeploymentPath)
    console.log('==> rootDeploymentApplicationPath: ', rootDeploymentApplicationPath)
    console.log('==> supportedLocales: ', options.locales)

    this._rootProjectPath = rootProjectPath
    this._rootApplicationPath = rootApplicationPath
    this._rootDeploymentPath = rootDeploymentPath
    this._rootDeploymentApplicationPath = rootDeploymentApplicationPath

    let projectConfigurationOptions = {
      applicationName: options.name,
      applicationHost: options.host,
      rootProjectPath: rootProjectPath,
      rootApplicationPath: rootApplicationPath,
      rootDeploymentPath: rootDeploymentPath,
      rootDeploymentApplicationPath: rootDeploymentApplicationPath,
      environment: options.environment,
      locales: options.locales,
      port: options.port,
      pingPort: options.pingPort
    }

    let webpackConfigurationOptions = {
      ...projectConfigurationOptions,
      devPort: options.devPort
    }
    console.log('Building webpack configurations, we will put on some commonly used plugin & configuration.')
    this._webpackConfigurationFactory = new WebpackConfigurationFactory(webpackConfigurationOptions)
    this._webpackConfiguration = this._webpackConfigurationFactory.createWebpackConfiguration(webpackConfigurationOptions)
    this._compiler = this._createWebpackCompiler(this._webpackConfiguration)
  }

  run () {
    if (this._options.environment === 'development') {
      console.log('[COMPILER] Initiating server compilation')
      let serverConfiguration = this._webpackConfiguration[0]
      let serverCompiler = this._createWebpackCompiler(serverConfiguration)
      serverCompiler.watch({
        aggregateTimeout: 300,
        poll: true
      }, (err, stats) => {
        if (err) console.error(err)
        // console.log(stats.toString({ colors: true }))
        console.log(stats.compilation.errors.toString({ colors: true }))
        console.log(stats.compilation.warnings.toString({ colors: true }))
        console.log('[COMPILER] Server compilation finished. Watching for server file changes.')
      })

      console.log('[COMPILER] Initiating client compilation using webpack-dev-server')
      let clientConfiguration = this._webpackConfiguration[1]
      let clientCompiler = this._createWebpackCompiler(clientConfiguration)
      let clientDevServer = new WebpackDevServer(clientCompiler, {
        contentBase: path.join(this._rootApplicationPath, 'build'),
        hot: true,
        filename: 'main.js',
        proxy: {
          '*': 'http://localhost:' + this._options.port
        },
        watchOptions: {
          aggregateTimeout: 300,
          poll: 1000
        },
        publicPath: '/assets',
        noInfo: true
        // stats: { colors: true }
      })
      clientDevServer.listen(this._options.devPort, (err) => {
        if (err) {
          console.err(err)
        } else {
          console.log('\n[COMPILER] webpack-dev-server is listening at port ' + this._options.devPort)
          console.log('[COMPILER] Client compilation finished. Watching for client file changes.')
        }
      })
    } else {
      console.log('[COMPILER] Initiating compilation.')
      this._compiler = this._createWebpackCompiler(this._webpackConfiguration)
      this._compiler.run((err, stats) => {
        if (err) console.error(err)
        // console.log(stats.toString({ colors: true }))
        console.log('[COMPILER] Compilation finished.')
      })
    }
  }

  _createWebpackCompiler (configuration) {
    let compiler = webpack(configuration)
    return compiler
  }
}

export default UniversalWebApplicationSetup
