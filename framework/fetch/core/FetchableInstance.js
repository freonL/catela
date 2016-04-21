import DataFetch from 'fetch/core/DataFetch'

let logger = global.Logger.getLogger('FetchableInstance')

class FetchableInstance extends DataFetch {
  constructor (FetchClass) {
    super()
    this._innerFetchInstance = new FetchClass()
  }

  fetch (store, context, callback) {
    this._innerFetchInstance.fetch(store, context, (err, results) => {
      callback(err, results)
    })
  }
}

export default FetchableInstance
