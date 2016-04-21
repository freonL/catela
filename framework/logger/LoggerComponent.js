import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

winston.transports.DailyRotateFile = DailyRotateFile

class LoggerComponent {
  constructor (context) {
    this._context = context
    this.__logPath = '/logs/' + context
    this.init()
  }

  init () {
    this._logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,
          prettyPrint: true
        }),
        new winston.transports.DailyRotateFile({
          tailable: true,
          filename: this.__logPath + '/' + this._context,
          datePattern: '.yyyy-MM-dd.log',
          timestamp: true,
          maxFiles: 10,
          colorize: true,
          prettyPrint: true
        })
      ]
    })
  }

  getLogger () {
    return this._logger
  }

}

class DecoratedContextLogger {
  constructor (logger, logContextName) {
    this._context = logContextName
    this._logger = logger
  }

  log (level, log, data) {
    this._logger.log(level, '[' + this._context + '] ' + log, data)
  }

  view (data) {
    var dataObj = {}
    if (typeof data !== 'undefined' && data !== null) {
      dataObj.data = data
    }
    this._logger.log('info', '[' + this._context + '] ', dataObj)
  }

  info (log, data) {
    var dataObj = {}
    if (typeof data !== 'undefined' && data !== null) {
      dataObj.data = data
    }
    this._logger.log('info', '[' + this._context + '] ' + log, dataObj)
  }

  warn (log, data) {
    var dataObj = {}
    if (typeof data !== 'undefined' && data != null) {
      dataObj.data = data
    }
    this._logger.log('warn', '[' + this._context + '] ' + log, dataObj)
  }

  error (log, exception, data) {
    var dataObj = {}
    if (typeof data !== 'undefined' && data != null) {
      dataObj.data = data
    }
    if (typeof exception !== 'undefined' && exception != null) {
      dataObj.ex = exception
    }
    this._logger.log('error', '[' + this._context + '] ' + log, {
      stackTrace: exception.stack,
      data: dataObj.data
    })
  }

  debug (log, data) {
    var dataObj = {}
    if (typeof data !== 'undefined' && data != null) {
      dataObj.data = data
    }
    this._logger.log('debug', '[' + this._context + '] ' + log, dataObj)
  }
}

class LogManager {
  constructor (loggerComponent) {
    this._loggerComponent = loggerComponent
  }

  getLogger (logContextName) {
    var decoratedLogger = new DecoratedContextLogger(this._loggerComponent.getLogger(), logContextName)
    return decoratedLogger
  }
}

export default {
  configure: function configure (context) {
    var contextLoggerComponent = new LoggerComponent(context)
    return new LogManager(contextLoggerComponent)
  }
}
