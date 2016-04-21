import TrackingService from 'tracking/service/TrackingService'

class GoogleTagManagerTrackingService extends TrackingService {
  constructor () {
    super()
  }

  track (event, data, options) {
    if (window.dataLayer != null && typeof window.dataLayer !== 'undefined') {
      let trackingData = {
        'event': event,
        ...data
      }
      window.dataLayer.push(trackingData)
    }
  }
}

export default GoogleTagManagerTrackingService
