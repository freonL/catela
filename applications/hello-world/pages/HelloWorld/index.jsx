import React from 'react'
import styles from './styles'

class HelloWorld extends React.Component {
  constructor () {
    super()
  }

  render () {
    return (
      <div className={styles.helloWorldText}>
        Hello World from Catela !
      </div>
    )
  }
}

export default HelloWorld
