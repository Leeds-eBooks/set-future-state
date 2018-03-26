// @flow

import {Component, PureComponent} from 'react'
import {isFuture, tryP} from 'fluture'

const getErrorTarget = ({constructor}) => {
  const name = constructor.displayName || constructor.name
  return name ? ` Check your ${name} component.` : ''
}

const create = SuperClass =>
  class FutureState<P, S> extends SuperClass<P, S> {
    _cancels: Array<() => void> = []

    // FIXME: prevent (or handle) overriding – monkey-patch? Inject?
    componentWillUnmount() {
      this._cancels.forEach(fn => fn())
    }

    setFutureState<V>(
      eventual: Future<V> | (() => Promise<V>),
      reducer: (value?: V, prevState: S, props: P) => $Shape<S> | null,
      onError?: Error => mixed
    ) {
      if (!(isFuture(eventual) || typeof eventual === 'function')) {
        throw new TypeError(
          `The first argument to setFutureState() must be a Future or a Function which returns a Promise.${getErrorTarget(
            this
          )}`
        )
      }

      const future = typeof eventual === 'function' ? tryP(eventual) : eventual

      const resolver = (v?: V) =>
        this.setState((prevState, props) => reducer(v, prevState, props))

      this._cancels.push(
        onError
          ? future.fork(onError, resolver)
          : future.done((e, v) => resolver(v))
      )
    }
  }

export class ComponentFutureState<P, S> extends create(Component)<P, S> {}
export class PureComponentFutureState<P, S> extends create(PureComponent)<
  P,
  S
> {}
