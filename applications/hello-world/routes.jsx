import React from 'react'
import { Route, IndexRoute } from 'react-router'

import App from 'pages/App'
import HelloWorld from 'pages/HelloWorld'

let routes = [
  <Route key='root' name='root' component={App}>
    <IndexRoute key='hello-world' name='hello-world' route='hello-world' component={HelloWorld} />
  </Route>
]

export default routes
