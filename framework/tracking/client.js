import ClientTracker from 'tracking/ClientTracker'

if (window.ClientTracker === null || typeof window.ClientTracker === 'undefined') {
  window.ClientTracker = new ClientTracker()
  window.global = {
    ClientTracker: window.ClientTracker
  }
}
