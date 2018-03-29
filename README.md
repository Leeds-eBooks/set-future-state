# setFutureState

[![npm version](https://badge.fury.io/js/set-future-state.svg)](https://www.npmjs.com/package/set-future-state)
[![Build Status](https://travis-ci.org/Leeds-eBooks/set-future-state.svg?branch=master)](https://travis-ci.org/Leeds-eBooks/set-future-state)
[![Greenkeeper badge](https://badges.greenkeeper.io/Leeds-eBooks/set-future-state.svg)](https://greenkeeper.io/)

```sh
npm install --save set-future-state
# or
yarn add set-future-state
```

# The Problem

> Warning: Can only update a mounted or mounting component. This usually means you called setState, replaceState, or forceUpdate on an unmounted component. This is a no-op.

In React, calling `this.setState()` in an `async` function, or in the `.then()` method of a `Promise`, is very common and very useful. But if your component is unmounted before your async/promise resolves, you’ll get the above error in your console. The React blog [suggests](https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html) using cancelable Promises, but as [Aldwin Vlasblom explains](https://medium.com/@avaq/broken-promises-2ae92780f33):

> Because Promises were designed to have no control over the computation and make their values accessible to any number of consumers, it makes little sense, and turns out to be quite a challenge, to implement cancellation.

Enter [Futures](https://github.com/fluture-js/Fluture/wiki/Comparison-to-Promises).

# The Solution

This library has a single default export: the function `withFutureState()`.

<details>
<summary><code>withFutureState()</code> type signature (in <a href="https://flow.org/">flow</a> notation)</summary>

```js
type SetFutureState<P, S> = <E, V>(
  self: Component<P, S>,
  eventual: Future<E, V> | (() => Promise<V>),
  reducer: (value?: V, prevState: S, props: P) => $Shape<S> | null,
  onError?: (error: E) => *
) => void

declare export default function withFutureState<P, S>(
  builder: (setFutureState: SetFutureState<P, S>) => Class<Component<P, S>>
): Class<Component<P, S>>
```

</details>

### Usage

`withFutureState()` is an [Inheritance Inversion Higher-Order Component](https://medium.com/@franleplant/react-higher-order-components-in-depth-cf9032ee6c3e#5247). It takes a single argument, a function, which must return a React Class Component (i.e. a [class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) that inherits from `React.Component` or `React.PureComponent`). That function receives a single argument, `setFutureState`: your tool for safely updating your component's state in the future.

```js
import {Component} from 'react'
import withFutureState from 'set-future-state'

export default withFutureState(
  setFutureState =>
    class MyComponent extends Component {
      state = {
        loading: true,
        fetchCount: 0,
        data: null,
      }

      componentDidMount() {
        setFutureState(
          this,
          () => fetch('https://www.example.com'),
          (data, prevState, props) => ({
            data,
            loading: false,
            fetchCount: prevState.fetchCount + 1,
          }),
          error => console.error(error)
        )
      }

      render() {
        return this.state.loading ? (
          <p>Loading . . .</p>
        ) : (
          <p>{JSON.stringify(this.state.data)}</p>
        )
      }
    }
)
```

`setFutureState()` takes the following 4 arguments:

* **`self`** (required)

  Pass `this` as the first argument, so that `setFutureState()` can update your component's state.

* **`eventual`** (required)

  The second argument should be either:

  * a function that returns a `Promise`. When it resolves, the resolved value will be passed to the **`reducer`**.
  * a [`Future`](https://github.com/fluture-js/Fluture).

* **`reducer`** (required)

  The third argument should be a function that takes 3 arguments, and returns your updated state. It is called when your **`eventual`** resolves. It works _[exactly like the function form of `setState`](https://reactjs.org/docs/react-component.html#setstate)_: return a partial state object, and it will merge it into your existing state; return `null`, and it will do nothing. The arguments passed to **`reducer`** are:

  * `value`: the resolved value from your **`eventual`** (`Promise` or `Future`)
  * `prevState`: your component's existing state
  * `props`: your component's props

* **`onError`** (optional)

  The fourth and final argument is optional: a function that is called if the **`eventual`** (`Promise` or `Future`) rejects. It is called with the rejection reason (ideally an `Error` object).

**IMPORTANT:** If you leave out **`onError`**, your **`reducer`** will be called if the **`eventual`** resolves **AND** if it rejects. This is useful, for example, to remove loading spinners when an ajax call completes, whether or not it was successful.
