import path from 'path'

module.exports = function (config) {
  config.set({
    browsers: ['Chrome'],
    files: [
      { pattern: 'test.webpack.js', watched: true }
    ],
    frameworks: ['jasmine'],
    preprocessors: {
      'test.webpack.js': ['webpack']
    },
    reporters: ['spec', 'progress', 'html'],
    singleRun: false,
    htmlReporter: {
      outputDir: 'karma_html', // where to put the reports
      templatePath: null, // set if you moved jasmine_template.html
      focusOnFailures: true, // reports show failures on start
      namedFiles: false, // name files instead of creating sub-directories
      pageTitle: null, // page title for reports; browser info by default
      urlFriendlyName: false, // simply replaces spaces with _ for files/dirs
      reportName: 'report-summary-filename', // report summary filename; browser info by default
      preserveDescribeNesting: false, // folded suites stay folded
      foldAll: false // reports start folded (only with preserveDescribeNesting)
    },
    webpack: {
      module: {
        loaders: [
          { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader' }
        ]
      },
      watch: true
    },
    webpackServer: {
      noInfo: false
    }
  })
}


class KarmaConfigurationFactory {
  constructor (options) {
    this._options = options
    this._application = options.application
    this._rootProjectPath = options.rootProjectPath
    this._rootApplicationPath = path.join(this._rootProjectPath, 'applications', this._application)

    this.DEFAULT_KARMA_CONFIGURATION_FILENAME = 'karma.conf.js'
  }

  _createWebpackSection (testSpec) {

  }

  _createBrowserSection (testSpec) {

  }

  _createPreprocessorsSection (testSpec) {

  }

  _createFrameworkSection (testSpec) {

  }

  createTestConfiguration (spec) {
    let testSpec = spec.spec
    let karmaConfiguration = {}
    let webpack = this._createWebpackSection(testSpec)
    let browsers = this._createBrowserSection(testSpec)
    let framework = this._createFrameworkSection(testSpec)
    let preprocessor = this._createPreprocessorsSection(testSpec)
  }
}

export default KarmaConfigurationFactory
