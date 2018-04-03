// @flow

import {Component} from 'react'
import withFutureState from './set-future-state'

type Props = {}

type State = {
  num?: number,
  str?: string,
  loading: boolean,
}

export default withFutureState(
  setFutureState =>
    class MyComponent extends Component<Props, State> {
      state = {
        loading: false,
      }

      method() {
        // $FlowExpectError
        setFutureState()

        // $FlowExpectError
        setFutureState(() => Promise.resolve(1), () => ({}))

        // $FlowExpectError
        setFutureState({}, () => Promise.resolve(1), () => ({}))

        setFutureState(
          this,
          () => Promise.resolve(1),
          // $FlowExpectError
          () => ({other: 'string'})
        )

        setFutureState(
          this,
          () => Promise.resolve(1),
          // $FlowExpectError
          (num: string) => ({num, loading: true})
        )

        setFutureState(
          this,
          () => Promise.resolve(1),
          num => ({num, loading: true})
        )

        setFutureState(
          this,
          () => Promise.resolve(''),
          str => ({str, loading: true})
        )
      }

      render() {
        return 'test'
      }
    }
)
