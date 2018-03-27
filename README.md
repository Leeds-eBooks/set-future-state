# Set Future State

[![npm version](https://badge.fury.io/js/set-future-state.svg)](https://www.npmjs.com/package/set-future-state)
[![Build Status](https://travis-ci.org/Leeds-eBooks/set-future-state.svg?branch=master)](https://travis-ci.org/Leeds-eBooks/set-future-state)
[![Greenkeeper badge](https://badges.greenkeeper.io/Leeds-eBooks/set-future-state.svg)](https://greenkeeper.io/)

```sh
npm install --save set-future-state
# or
yarn add set-future-state
```

# The Problem

```
Warning: Can only update a mounted or mounting component.
This usually means you called setState, replaceState,
or forceUpdate on an unmounted component. This is a no-op.
```

In React, calling `this.setState()` in an `async` function, or in the `.then()` method of a `Promise`, is very common and very useful. But if your component is unmounted before your async/promise resolves, you’ll get the above error in your console. The React blog [suggests](https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html) using cancelable Promises, but as [Aldwin Vlasblom explains](https://medium.com/@avaq/broken-promises-2ae92780f33):

> Because Promises were designed to have no control over the computation and make their values accessible to any number of consumers, it makes little sense, and turns out to be quite a challenge, to implement cancellation.

Enter [Futures](https://github.com/fluture-js/Fluture/wiki/Comparison-to-Promises).

# The Solution

```js
import {ComponentFutureState} from 'set-future-state'

class MyComponent extends ComponentFutureState {
  state = {
    loading: true,
    fetchCount: 0,
    data: null,
  }

  componentDidMount() {
    this.setFutureState(
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
```

# API

TODO...
