// You just need to import 'logger' once, it will install a global variable Logger
import config from './config'
import 'logger/server'
import 'services/server'
import 'plugins/server'
import ExpressUniversalApplicationServer from 'server/ExpressUniversalApplicationServer'
import reducers from 'reducers'
import routes from 'routes'

class HelloWorldApplicationServer extends ExpressUniversalApplicationServer {
  constructor (options) {
    super(options)
  }

  getRoutes () {
    return routes
  }

  getReducers () {
    return reducers
  }
}

let options = {
  ...__PROJECT__
}
global.__CONFIG__ = config

const server = new HelloWorldApplicationServer(options)
server.run()
