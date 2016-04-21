import 'logger/server'
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

const server = new HelloWorldApplicationServer(options)
server.run()
