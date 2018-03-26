// @flow

import {Component, PureComponent} from 'react'
import {isFuture, tryP} from 'fluture'

const create = SuperClass =>
  class PureComponentFutureState<P, S> extends SuperClass<P, S> {
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
        // TODO: add Component info
        throw new TypeError(
          `The first argument to setFutureState() must be a Future or a Function which returns a Promise.${
            this.constructor.name
              ? ` Check your ${this.constructor.name} component.`
              : ''
          }`
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

export const ComponentFutureState = create(Component)
export const PureComponentFutureState = create(PureComponent)
