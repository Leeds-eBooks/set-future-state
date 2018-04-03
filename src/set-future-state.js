// @flow

import type {Component} from 'react'
import {isFuture, tryP} from 'fluture'
import getDisplayName from 'recompose/getDisplayName'

const getErrorTarget = ({constructor}) => {
  const name = constructor.displayName || constructor.name
  return name ? `\n\nPlease check the code for the ${name} component.` : ''
}

if (!WeakMap) {
  throw new TypeError(
    '`setFutureState` requires WeakMap to be available. Consider including a polyfill such as core-js.'
  )
}

// $FlowFixMe
const cancelers: WeakMap<
  // flowlint-next-line unclear-type:off
  Component<any, any>,
  $ReadOnlyArray<() => void>
> = new WeakMap()

type SetFutureState<P, S> = <E, V>(
  self: Component<P, S>,
  eventual: Future<E, V> | (() => Promise<V>),
  reducer: (value?: V, prevState: S, props: P) => $Shape<S> | null,
  onError?: (error: E) => *
) => void

export default <P, S>(
  factory: (SetFutureState<P, S>) => Class<Component<P, S>>
) => {
  function setFutureState(self, eventual, reducer, onError) {
    if (!(isFuture(eventual) || typeof eventual === 'function')) {
      throw new TypeError(
        `The first argument to setFutureState() must be a Future or a Function which returns a Promise.${getErrorTarget(
          self
        )}`
      )
    }

    const future = typeof eventual === 'function' ? tryP(eventual) : eventual

    const resolver = v =>
      // $FlowFixMe
      self.setState((prevState, props) => reducer(v, prevState, props))

    cancelers.set(
      self,
      (cancelers.get(self) || []).concat(
        onError
          ? future.fork(onError, resolver)
          : future.done((e, v) => resolver(v))
      )
    )
  }

  const UserComponent = factory(setFutureState)

  return class WithFutureState extends UserComponent {
    static displayName = `WithFutureState(${getDisplayName(UserComponent)})`

    componentWillUnmount() {
      if (super.componentWillUnmount) super.componentWillUnmount()
      const arr = cancelers.get(this)
      if (arr) arr.forEach(fn => fn())
    }
  }
}
