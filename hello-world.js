'use strict'
require('babel-core/register')({})
var UniversalWebApplicationSetup = require('setup/UniversalWebApplicationSetup')

var NODE_ENV = process.env.NODE_ENV || 'development'
var port = (NODE_ENV === 'development') ? 8082 : 9090
var rootDeploymentPath = __dirname
var host = 'http://localhost'
console.log('Application bootstrapping. NODE_ENV:', NODE_ENV, __dirname)

var setup = UniversalWebApplicationSetup.create({
  name: 'hello-world',
  host: host,
  rootProjectPath: __dirname,
  rootDeploymentPath: rootDeploymentPath,
  environment: NODE_ENV,
  port: port,
  devPort: 9090,
  pingPort: 9999,
  locales: [
    'id-id'
  ]
})

setup.run()
