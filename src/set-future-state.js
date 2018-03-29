// @flow

import type {Component} from 'react'
import {isFuture, tryP} from 'fluture'
import getDisplayName from 'recompose/getDisplayName'

const getErrorTarget = ({constructor}) => {
  const name = constructor.displayName || constructor.name
  return name ? `\n\nPlease check the code for the ${name} component.` : ''
}

type SetFutureState<E, V, P, S> = (
  self: Component<P, S>,
  eventual: Future<E, V> | (() => Promise<V>),
  reducer: (value?: V, prevState: S, props: P) => $Shape<S> | null,
  onError?: (E) => *
) => void

export default <E, V, P, S>(
  builder: (SetFutureState<E, V, P, S>) => Class<Component<P, S>>
) => {
  const cancels: Array<() => void> = []

  function setFutureState(self, eventual, reducer, onError) {
    if (!(isFuture(eventual) || typeof eventual === 'function')) {
      throw new TypeError(
        `The first argument to setFutureState() must be a Future or a Function which returns a Promise.${getErrorTarget(
          self
        )}`
      )
    }

    const future = typeof eventual === 'function' ? tryP(eventual) : eventual

    const resolver = (v?: V) =>
      self.setState((prevState, props) => reducer(v, prevState, props))

    cancels.push(
      onError
        ? future.fork(onError, resolver)
        : future.done((e, v) => resolver(v))
    )
  }

  const UserComponent = builder(setFutureState)

  return class WithFutureState extends UserComponent {
    static displayName = `WithFutureState(${getDisplayName(UserComponent)})`

    componentWillUnmount() {
      if (super.componentWillUnmount) super.componentWillUnmount()
      cancels.forEach(fn => fn())
    }
  }
}
