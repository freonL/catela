import async from 'async'
import FetchableInstanceFactory from 'fetch/core/FetchableInstanceFactory'

const fetchableInstanceFactory = new FetchableInstanceFactory()

let logger = global.Logger.getLogger('CoreFetch')

function fetch (fetchClasses) {
  return function wrapWithFetch (WrappedComponent) {
    class FetchableWrappedComponent extends WrappedComponent {
      constructor (props, context) {
        super(props, context)
        this.fetch = {}
      }

      render () {
        return this.__innerRender()
      }
    }

    FetchableWrappedComponent.prototype.__innerRender = WrappedComponent.prototype.render
    FetchableWrappedComponent.__fetchData = function (store, context, callback) {
      if (typeof fetchClasses !== 'undefined' && fetchClasses != null) {
        let asyncCalls = {}
        Object.keys(fetchClasses).forEach((kc) => {
          asyncCalls[kc] = (callback) => {
            let fetchDataInstance = fetchableInstanceFactory.getFetchableInstance(fetchClasses[kc])
            fetchDataInstance.fetch(store, context, (err, results) => {
              if (err) {
                logger.error('[' + kc + '] Unknown error occurred when trying to fetch data. ', err)
                callback(err, null)
              } else {
                store[kc] = results
                callback(null, results)
              }
            })
          }
        })
        async.series(asyncCalls, (err, results) => {
          if (err) {
            callback(err, null)
          } else {
            callback(null, results)
          }
        })
      } else {
        callback(null, store)
      }
    }
    return FetchableWrappedComponent
  }
}

function simpleReducer (state = {}, action) {
  switch (action.type) {
    case '__SET_VIEW_STATE__':
      let newState = {
        ...state,
        ...action.data
      }
      return newState
    default:
      return state
  }
  return state
}

let serverFetchAction = {
  setServerState () {
    return {

    }
  }
}

export default {
  fetch: fetch,
  serverFetchReducer: simpleReducer
}
