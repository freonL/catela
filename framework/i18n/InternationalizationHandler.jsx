import React from 'react'

class InternationalizationHandler extends React.Component {
  constructor () {
    super()
  }

  render () {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

InternationalizationHandler.propTypes = {
  children: React.PropTypes.any
}

InternationalizationHandler.contextTypes = {
  intl: React.PropTypes.object
}

export default InternationalizationHandler
