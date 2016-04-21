import TrackingService from 'tracking/service/TrackingService'

class ClientTracker extends TrackingService {
  constructor () {
    super()
    this._trackingServices = {}
  }

  register (key, service) {
    this._trackingServices[key] = service
  }

  track (event, data, options) {
    Object.keys(this._trackingServices).forEach((k) => {
      let trackingService = this._trackingServices[k]
      trackingService.track(event, data, options)
    })
  }
}

export default ClientTracker
