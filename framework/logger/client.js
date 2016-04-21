import LoggerComponent from 'logger/ClientLoggerComponent'
let project = __PROJECT__
if (global.Logger === null || typeof global.Logger === 'undefined') {
  global.Logger = LoggerComponent.configure(project.applicationName)
}
