import 'intl' // Polyfill
import 'intl/locale-data/jsonp/en.js'
import React from 'react'
import { IntlProvider } from 'react-intl'

class UniversalPageHandler extends React.Component {
  render () {
    return (
      <IntlProvider locale='en'>
        {this.props.children}
      </IntlProvider>
    )
  }
}

UniversalPageHandler.propTypes = {
  children: React.PropTypes.any
}

export default UniversalPageHandler
