import KarmaConfigurationFactory from 'test/karma/KarmaConfigurationFactory'
import path from 'path'

class UnitTestSetup {
  constructor (options) {
    this._options = options
    this._application = options.application
    this._spec = options.spec
    this._rootProjectPath = options.projectPath
    this._rootApplicationPath = path.join(this._rootProjectPath, 'applications', this._application)
    this._testSpecFile = path.join(this._rootApplicationPath, this._spec)

    let karmaConfigurationFactoryOptions = {
      rootProjectPath: this._rootProjectPath,
      rootApplicationPath: this._rootApplicationPath,
      application: this._application
    }

    this._karmaConfigurationFactory = new KarmaConfigurationFactory(karmaConfigurationFactoryOptions)
  }

  run () {
    console.log('=> rootProjectPath: ' + this._rootProjectPath)
    console.log('=> rootApplicationPath: ' + this._rootApplicationPath)
    console.log('=> testSpecFile: ' + this._testSpecFile)

    let testConfigurationSpec = {
      spec: this._testSpecFile
    }
    this._karmaConfigurationFactory.createTestConfiguration(testConfigurationSpec)
  }
}

export default UnitTestSetup
