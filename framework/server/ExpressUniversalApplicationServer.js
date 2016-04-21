import async from 'async'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import createLocation from 'history/lib/createLocation'
import express from 'express'
import InternationalizationHandler from 'i18n/InternationalizationHandler'
import UniversalPageHandler from 'UniversalPageHandler'
import path from 'path'
import preconditions from 'preconditions'
import querystring from 'querystring'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Provider } from 'react-redux'
import { Route, RoutingContext, match } from 'react-router'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import * as reducers from 'reducers'
import thunk from 'redux-thunk'
import SimpleHtmlRenderer from 'render/SimpleHtmlRenderer'
import { serverFetchReducer } from 'fetch/core'
import resolve from 'es6-template-strings/resolve-to-string'
import forceDomain from 'forcedomain'

let logger = global.Logger.getLogger('ExpressUniversalApplicationServer')
// Currently supported locale is /{lang}-{country}/*
let LOCALE_REGEX = /^\/([a-z]{2})-([a-z]{2})(.*)$/
let LOCALE_DEFAULT = 'id-id'

let QS_REGEX = /^\?(.*)$/

const createStoreWithMiddleware = applyMiddleware(
  thunk
)(createStore)

class ExpressUniversalApplicationServer {
  constructor (options) {
    let pc = preconditions.instance(options)
    pc.shouldBeDefined('port', 'port must be defined.')
    pc.shouldBeDefined('rootApplicationPath', 'rootApplicationPath must be defined.')
    pc.shouldBeDefined('rootDeploymentApplicationPath', 'rootDeploymentApplicationPath must be defined.')
    this._options = options
    this._app = express()
    this._routes = this.getRoutes()
    this._reducers = this.getReducers()
    this._initialize()
  }

  _initialize () {
    this._setupAssetsServing()
    this._setupCookieParser()
    this._setupBodyParser()
    this._setupHtmlRenderer()
    this._setupInternationalizedRoutes()
    this._setupI18nHandler()
    this._setupForceDomain()
    this._setupRoutingHandler()
  }

  _setupAssetsServing () {
    console.log(path.join(this._options.rootDeploymentApplicationPath, 'build', this._options.environment, 'client'))
    // TODO : this should be configurable, but we hard code it for now
    logger.info('Using ' + path.join(this._options.rootDeploymentApplicationPath, 'build', this._options.environment, 'client') + ', with /assets as assets serving routes')
    this._app.use('/assets', express.static(path.join(this._options.rootDeploymentApplicationPath, 'build', this._options.environment, 'client')))

    // TODO : this should be configurable, but we hard code it for now
    logger.info('Using ' + path.join(this._options.rootDeploymentApplicationPath, 'assets') + ', with /assets/static as static non-compileable assets serving routes')
    this._app.use('/assets/static', express.static(path.join(this._options.rootDeploymentApplicationPath, 'assets')))
  }

  _setupCookieParser () {
    this._app.use(cookieParser())
  }

  _setupBodyParser () {
    this._app.use(bodyParser.urlencoded({ extended: true }))
    this._app.use(bodyParser.json())
  }

  _setupHtmlRenderer () {
    let htmlRendererOptions = {
      path: path.join(this._options.rootDeploymentApplicationPath, 'html'),
      cache: !(this._options.environment === 'development')
    }
    this._renderer = new SimpleHtmlRenderer(htmlRendererOptions)
  }

  _setupInternationalizedRoutes () {
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

  _setupI18nHandler () {
    this._app.use((req, res, next) => {
      let match = LOCALE_REGEX.exec(req.url)
      let url = null
      if (match != null) {
        let lang = match[1]
        let country = match[2]
        url = match[3]
        req.locale = lang + '-' + country
      } else {
        req.locale = LOCALE_DEFAULT
      }
      if (this._options.locales.indexOf(req.locale) >= 0) {
        next()
      } else {
        if (this._options.locales.length === 0) {
          next()
        } else {
          if (url == null || typeof url === 'undefined' || url.length === 0) {
            res.redirect('/')
          } else {
            res.redirect(url)
          }
        }
      }
    })
  }

  _setupForceDomain () {
    this._app.use(forceDomain({
      hostname: this._stripProtocol(this._options.applicationHost),
      protocol: 'http'
    }))
  }

  _stripProtocol (url) {
    if (url != null && typeof url !== 'undefined') {
      let result = url.replace(/.*?:\/\//g, '')
      return result
    }
    return null
  }

  _handleError500 (message, err, res) {
    logger.error(message, err)
    if (this._options.environment === 'production' || true) {
      res.redirect('/')
    } else {
      let error = '<br />'
      if (this._options.environment === 'development') {
        if (err != null && typeof err !== 'undefined') {
          error += err.stack
        }
      }
      error = error.replace('\n', '<br />')
      this._renderer.render('500.html', (err, rendered) => {
        if (err) {
          logger.error('[ERROR_RENDER_FATAL] An unknown error occurred when trying to render error 500.', err)
          return res.status(500).end('An unknown error occurred when trying to render error 500\n' + err.stack)
        } else {
          return res.status(500).end(resolve(rendered, { ERROR: error }))
        }
      })
    }
  }

  _handleNotFound404 (res) {
    this._renderer.render('404.html', (err, rendered) => {
      if (err) {
        logger.error('[ERROR_RENDER_FATAL] An unknown error occurred when trying to render error 404.', err)
        return res.status(500).end('An unknown error occurred when trying to render error 404\n' + err.stack)
      } else {
        return res.status(404).end(resolve(rendered, {}))
      }
    })
  }

  _setupRoutingHandler () {
    const routes = this._routes
    this._app.use((req, res) => {
      const location = createLocation(req.url)
      const locale = req.locale

      logger.info('[HANDLING_ROUTE] path: ' + req.url + ', locale: ' + locale)
      match({ routes, location }, (err, redirectLocation, renderProps) => {
        if (err) {
          return this._handleError500('[MATCH_ROUTE_FATAL_ERROR] An unknown error occurred when trying to match routes.', err, res)
        }

        if (!renderProps) {
          logger.info('[ROUTE_NOT_FOUND] path: ' + req.url + ', locale: ' + locale)
          return this._handleNotFound404(res)
        }
        let query = {}
        let queryStringMatch = QS_REGEX.exec(renderProps.location.search)
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
          host: this._options.applicationHost,
          url: req.url,
          path: location.pathname,
          locale: locale,
          params: renderProps.params,
          query: query,
          routes: simplifiedRoutes,
          environment: this._options.environment,
          server: true,
          client: false
        }

        let renderedServerComponents = renderProps.components
        let fetchDataQueue = []
        let dataContextObject = {}

        renderedServerComponents.forEach((rsc) => {
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
            return this._handleError500('[FETCH_DATA_ERROR] An unknown error occurred when trying to fetch data.', err, res)
          } else {
            let fetchedDataContext = {}
            results.forEach((result) => {
              fetchedDataContext = {
                ...fetchedDataContext,
                ...result
              }
            })

            let allReducers = {
              ...reducers,
              view: serverFetchReducer
            }
            const store = createStoreWithMiddleware(combineReducers(allReducers))

            store.dispatch({
              type: '__SET_VIEW_STATE__',
              data: fetchedDataContext
            })

            const InitialComponent = (
              <Provider store={store}>
                <RoutingContext {...renderProps} />
              </Provider>
            )

            let finalRenderPage = 'main.html'

            renderedServerComponents.forEach((rsc) => {
              if (rsc.__renderPage != null && typeof rsc.__renderPage !== 'undefined') {
                finalRenderPage = rsc.__renderPage
              }
            })

            let renderBindFnQueue = []
            renderedServerComponents.forEach((rsc) => {
              if (rsc.__renderBindFn != null && typeof rsc.__renderBindFn !== 'undefined') {
                let bindFnCall = (callback) => {
                  setTimeout(() => {
                    rsc.__renderBindFn(store.getState(), fetchContext, callback)
                  }, 1)
                }
                renderBindFnQueue.push(bindFnCall)
              }
            })

            if (renderBindFnQueue.length > 0) {
              async.series(renderBindFnQueue, (err, results) => {
                if (err) {
                  return this._handleError500('[RENDER_BIND_PHASE] FATAL_ERROR in render data binding phase.', err, res)
                } else {
                  this._renderer.render(finalRenderPage, (err, rendered) => {
                    if (err) {
                      return this._handleError500('[RENDER_VIEW_PHASE] FATAL_ERROR in render view template phase.', err, res)
                    } else {
                      let bindData = {}
                      if (results != null && typeof results !== 'undefined') {
                        results.forEach((r) => {
                          bindData = {
                            ...bindData,
                            ...r
                          }
                        })
                      }
                      try {
                        const HTML = renderToStaticMarkup(InitialComponent)
                        const PAGE_HTML = resolve(rendered, {
                          ...bindData,
                          HTML: HTML,
                          DATA: store.getState()
                        }, { partial: true })
                        res.end(PAGE_HTML)
                      } catch (err) {
                        return this._handleError500('[RENDER_STATIC_MARKUP_PHASE] FATAL_ERROR in render staticMarkup phase.', err, res)
                      }
                    }
                  })
                }
              })
            } else {
              this._renderer.render(finalRenderPage, (err, rendered) => {
                if (err) {
                  return this._handleError500('[RENDER_VIEW_PHASE] FATAL_ERROR in render view template phase.', err, res)
                } else {
                  let bindData = {}
                  try {
                    const HTML = renderToStaticMarkup(InitialComponent)
                    const PAGE_HTML = resolve(rendered, {
                      ...bindData,
                      HTML: HTML,
                      DATA: store.getState()
                    }, { partial: true })
                    res.end(PAGE_HTML)
                  } catch (err) {
                    return this._handleError500('[RENDER_STATIC_MARKUP_PHASE] FATAL_ERROR in render staticMarkup phase.', err, res)
                  }
                }
              })
            }
          }
        })
      })
    })
  }

  run () {
    this._app.listen(this._options.port, (err) => {
      if (err) logger.error(err)
      else {
        logger.info('Server listening on port : ' + this._options.port)
      }
    })

    let pingApp = express()
    pingApp.use('/ping', (req, res) => {
      res.end('pong')
    })
    pingApp.listen(this._options.pingPort, (err) => {
      if (err) logger.error(err)
      else {
        logger.info('Ping server listening on port : ' + this._options.pingPort)
      }
    })
  }
}

export default ExpressUniversalApplicationServer
