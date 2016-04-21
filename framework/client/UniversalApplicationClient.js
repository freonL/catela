import async from 'async'
import { serverFetchReducer } from 'fetch/core'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import querystring from 'querystring'
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { Router, Route, match } from 'react-router'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import UniversalPageHandler from 'UniversalPageHandler'
import InternationalizationHandler from 'i18n/InternationalizationHandler'
import { scrollToY } from 'util/scrollToAnimation'

let logger = global.Logger.getLogger('UniversalApplicationClient')

let QS_REGEX = /^\?(.*)$/

const createStoreWithMiddleware = applyMiddleware(
  thunk
)(createStore)

class UniversalApplicationClient {
  constructor (options) {
    logger.info('Initializing web application client.', this._options)
    this._options = options
    this._initialize()
  }

  _initialize () {
    this._setupReducers()
    this._setupStore()
    this._setupRouting()
    this._setupBrowserHistory()
    this._setupViewContainer()
  }

  _setupReducers () {
    let reducers = this.getReducers()
    let allReducers = {
      ...reducers,
      view: serverFetchReducer
    }
    this._reducers = allReducers
  }

  _setupStore () {
    this._store = createStoreWithMiddleware(combineReducers(this._reducers))
  }

  _setupRouting () {
    let finalRoutes = null
    let originalRoutes = this.getRoutes()
    let generatedRoutes = []
    this._options.locales.forEach((locale) => {
      let internationalRoute = (
        <Route key={locale} path={locale} component={InternationalizationHandler}>
          {originalRoutes}
        </Route>
      )
      generatedRoutes.push(internationalRoute)
    })

    generatedRoutes.push(originalRoutes)
    finalRoutes = (
      <Route path='/' component={UniversalPageHandler}>
        {
          generatedRoutes.map((route) => {
            return route
          })
        }
      </Route>
    )
    this._routes = finalRoutes
  }

  _setupBrowserHistory () {
    this._history = createBrowserHistory()
    this._history.listenBefore((location, callback) => {
      let routes = this._routes

      this._store.dispatch({
        type: '__ROUTE_START_TRANSITION__'
      })

      scrollToY(0, 10000, 'easeInOutQuint')
      match({ routes, location }, (err, redirectLocation, renderProps) => {
        if (err) {
          logger.error('[MATCH_FATAL_ERROR] Unknown error occurred.', err)
          callback(false)
        }

        if (!renderProps) {
          logger.error('[ROUTES_NOT_FOUND] An error occurred when trying to match routes. Routes not found.', {})
          callback(false)
        } else {
          let query = {}
          let queryStringMatch = QS_REGEX.exec(location.search)
          let queryString = ''
          if (queryStringMatch != null && typeof queryStringMatch !== 'undefined') {
            queryString = queryStringMatch[1]
          }
          if (queryString != null && typeof queryString !== 'undefined') {
            query = querystring.parse(queryString)
          }

          let simplifiedRoutes = {
            name: renderProps.routes[renderProps.routes.length - 1].name,
            path: renderProps.routes[renderProps.routes.length - 1].path
          }

          let fetchContext = {
            locale: null, // TODO how to handle this properly
            params: renderProps.params,
            query: query,
            routes: simplifiedRoutes
          }

          let renderedComponents = renderProps.components
          let fetchDataQueue = []
          let dataContextObject = {}

          renderedComponents.forEach((rsc) => {
            if (rsc.__fetchData != null && typeof rsc.__fetchData !== 'undefined') {
              let fnFetchCall = (callback) => {
                setTimeout(() => {
                  rsc.__fetchData(dataContextObject, fetchContext, callback)
                }, 1)
              }
              fetchDataQueue.push(fnFetchCall)
            }
          })

          async.series(fetchDataQueue, (err, results) => {
            if (err) {
              logger.error('[FETCH_DATA_ERROR] An error occurred when trying to fetch data.', err)
              callback(false)
            } else {
              let fetchedDataContext = {}
              results.forEach((result) => {
                fetchedDataContext = {
                  ...fetchedDataContext,
                  ...result
                }
              })

              this._store.dispatch({
                type: '__SET_VIEW_STATE__',
                data: fetchedDataContext
              })

              this._store.dispatch({
                type: '__ROUTE_FINISH_TRANSITION__'
              })

              callback(true)
            }
          })
        }
      })
    })
  }

  _setupViewContainer () {
    this._viewContainer = this._options.viewContainer
  }

  run () {
    this._store.dispatch({
      type: '__SET_VIEW_STATE__',
      data: this._options.initialState.view
    })
    render(
      <Provider store={this._store}>
        <Router children={this._routes} history={this._history} />
      </Provider>,
      this._viewContainer
    )
  }
}

export default UniversalApplicationClient
