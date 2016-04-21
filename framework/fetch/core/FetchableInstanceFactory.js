import FetchableInstance from 'fetch/core/FetchableInstance'

let logger = Logger.getLogger('FetchableInstanceFactory')

class FetchableInstanceFactory {
  constructor () {
    this._dataFetchInstanceCache = new Map()
  }

  getFetchableInstance (FetchClass) {
    let construct = true
    if (FetchClass.KeyProperty != null && typeof FetchClass.KeyProperty !== 'undefined') {
      if (FetchClass.EnableCache === true) {
        if (this._dataFetchInstanceCache.get(FetchClass.Key) != null && typeof FetchClass.Key !== 'undefined') {
          construct = false
        }
      }
    }
    if (construct) {
      let fetchableInstance = new FetchableInstance(FetchClass)
      this._dataFetchInstanceCache.set(FetchClass.KeyProperty, fetchableInstance)
      return fetchableInstance
    } else {
      return this._dataFetchInstanceCache.get(FetchClass.Key)
    }
  }
}

export default FetchableInstanceFactory
