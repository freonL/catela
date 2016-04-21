// You just need to import 'logger' once, it will install a global variable Logger
import config from './config'
import 'logger/client'
import 'services/client'
import 'plugins/client'
import 'external/react-day-picker.css'
import 'external/react-progress-bar.css'
import UniversalApplicationClient from 'client/UniversalApplicationClient'
import reducers from 'reducers'
import routes from 'routes'

class HelloWorldApplicationClient extends UniversalApplicationClient {
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

let initialState = window.__INITIAL_STATE__
let viewContainer = document.getElementById('main-view')
let options = {
  ...__PROJECT__,
  viewContainer,
  initialState
}

global.__CONFIG__ = config
global.__VIEW_CONTAINER__ = viewContainer

const client = new HelloWorldApplicationClient(options)
client.run()
