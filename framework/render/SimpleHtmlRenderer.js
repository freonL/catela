import compile from 'es6-template-strings/compile'
import fs from 'fs'
import path from 'path'
import ServerRenderer from 'render/ServerRenderer'

let logger = global.Logger.getLogger('SimpleHtmlRenderer')

class SimpleHtmlRenderer extends ServerRenderer {
  constructor (options) {
    super()
    this._options = options
    this._pageCache = {}
  }

  _loadHtml (htmlPath, callback) {
    logger.info('[RENDERING]', htmlPath)
    fs.readFile(htmlPath, (err, data) => {
      if (err) {
        callback(err, null)
      } else {
        let start = new Date().getTime()
        let htmlTemplate = compile(data.toString())
        let end = new Date().getTime()
        let elapsed = end - start
        logger.info('[TEMPLATE_COMPILATION] Finish compiling ' + htmlPath + ', elapsed: ' + elapsed + 'ms')
        if (this._options.cache) {
          logger.info('[TEMPLATE_CACHING] Caching ' + htmlPath)
          this._pageCache[htmlPath] = htmlTemplate
        }
        end = new Date().getTime()
        elapsed = end - start
        logger.info('[FINISH_RENDERING] ' + htmlPath + ' in: ' + elapsed + 'ms')
        callback(null, htmlTemplate)
      }
    })
  }

  render (file, callback) {
    let basePath = this._options.path
    let finalPath = path.join(basePath, file)
    if (this._pageCache[finalPath] == null || typeof this._pageCache[finalPath] === 'undefined') {
      this._loadHtml(finalPath, callback)
    } else {
      callback(null, this._pageCache[finalPath])
    }
  }
}

export default SimpleHtmlRenderer
