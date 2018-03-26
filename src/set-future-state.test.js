// @flow

import React from 'react'
import {of, after, rejectAfter, Future as future} from 'fluture'
import renderer from 'react-test-renderer'
import {PureComponentFutureState} from './set-future-state'

const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

type Props = {
  // flowlint-next-line unclear-type:off
  eventual: Future<any> | (() => Promise<any>),
  reducer: *,
  onError?: *,
}

type State = {
  loading: boolean,
  v?: mixed,
  props?: {},
}

class Test extends PureComponentFutureState<Props, State> {
  state = {loading: false}

  trigger() {
    this.setFutureState(
      this.props.eventual,
      this.props.reducer,
      this.props.onError
    )
  }

  render() {
    return this.state.loading.toString()
  }
}

describe('PureComponentFutureState', () => {
  describe('setFutureState', () => {
    it('throws for an incorrect first argument', () => {
      // $FlowExpectError
      const test = <Test eventual={''} reducer={() => ({})} />
      const render = renderer.create(test)
      const instance = render.getInstance()
      expect(instance.trigger.bind(instance)).toThrowErrorMatchingSnapshot()

      render.update(
        React.cloneElement(test, {eventual: () => Promise.resolve()})
      )
      expect(instance.trigger.bind(instance)).not.toThrow()

      render.update(React.cloneElement(test, {eventual: of('')}))
      expect(instance.trigger.bind(instance)).not.toThrow()
    })

    describe('onError', () => {
      const onError = jest.fn()
      const test = (
        <Test
          eventual={() => Promise.reject(new Error('TEST'))}
          reducer={() => ({})}
          onError={onError}
        />
      )
      let render
      let instance

      beforeEach(() => {
        onError.mockClear()
        render = renderer.create(test)
        instance = render.getInstance()
      })

      it('is called for a rejected Promise', async () => {
        expect(onError).not.toHaveBeenCalled()
        instance.trigger()
        expect(onError).not.toHaveBeenCalled()
        await wait(3)
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
      })

      it('is called for a rejected Future', async () => {
        render.update(
          React.cloneElement(test, {
            eventual: rejectAfter(1, new Error('TEST')),
          })
        )

        expect(onError).not.toHaveBeenCalled()
        instance.trigger()
        expect(onError).not.toHaveBeenCalled()
        await wait(3)
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
      })
    })

    describe('reducer', () => {
      const reducer = jest.fn()
      const test = (
        <Test eventual={() => Promise.resolve(5)} reducer={reducer} />
      )
      let render
      let instance

      beforeEach(() => {
        reducer.mockClear()
        render = renderer.create(test)
        instance = render.getInstance()
      })

      describe('with Promises', () => {
        it('is called for a resolved with undefined onError', async () => {
          expect(reducer).not.toHaveBeenCalled()
          instance.trigger()
          expect(reducer).not.toHaveBeenCalled()
          await wait(2)
          expect(reducer).toHaveBeenCalledWith(
            5,
            {loading: false},
            {eventual: expect.any(Function), reducer}
          )
        })

        it('is called for a resolved with defined onError', async () => {
          render.update(React.cloneElement(test, {onError: () => null}))

          expect(reducer).not.toHaveBeenCalled()
          instance.trigger()
          expect(reducer).not.toHaveBeenCalled()
          await wait(2)
          expect(reducer).toHaveBeenCalledWith(
            5,
            {loading: false},
            {
              eventual: expect.any(Function),
              reducer,
              onError: expect.any(Function),
            }
          )
        })
      })

      describe('with Futures', () => {
        let cloned

        beforeEach(() => {
          cloned = React.cloneElement(test, {eventual: after(1, 5)})
          render.update(cloned)
        })

        it('is called for a resolved with undefined onError', async () => {
          expect(reducer).not.toHaveBeenCalled()
          instance.trigger()
          expect(reducer).not.toHaveBeenCalled()
          await wait(2)
          expect(reducer).toHaveBeenCalledWith(
            5,
            {loading: false},
            {eventual: expect.any(future), reducer}
          )
        })

        it('is called for a resolved with defined onError', async () => {
          render.update(
            React.cloneElement(cloned, {
              onError: () => null,
            })
          )

          expect(reducer).not.toHaveBeenCalled()
          instance.trigger()
          expect(reducer).not.toHaveBeenCalled()
          await wait(2)
          expect(reducer).toHaveBeenCalledWith(
            5,
            {loading: false},
            {
              eventual: expect.any(future),
              reducer,
              onError: expect.any(Function),
            }
          )
        })
      })
    })

    describe('setState', () => {
      const reducer = jest.fn((v, prevState, props) => ({
        v,
        loading: !prevState.loading,
        props,
      }))

      describe('with Promises', () => {
        const test = (
          <Test eventual={() => Promise.resolve(5)} reducer={reducer} />
        )
        let instance
        let setStateSpy

        beforeEach(() => {
          reducer.mockClear()
          instance = renderer.create(test).getInstance()
          setStateSpy = jest.spyOn(instance, 'setState')
        })

        it('is called with correct partialState for a resolved', async () => {
          expect(setStateSpy).not.toHaveBeenCalled()
          instance.trigger()
          expect(setStateSpy).not.toHaveBeenCalled()
          await wait(2)
          expect(setStateSpy).toHaveBeenCalled()
          expect(instance.state).toEqual({
            v: 5,
            loading: true,
            props: expect.any(Object),
          })
        })
      })

      describe('with Futures', () => {
        const test = <Test eventual={after(1, 5)} reducer={reducer} />
        let instance
        let setStateSpy

        beforeEach(() => {
          reducer.mockClear()
          instance = renderer.create(test).getInstance()
          setStateSpy = jest.spyOn(instance, 'setState')
        })

        it('is called with correct partialState for a resolved', async () => {
          expect(setStateSpy).not.toHaveBeenCalled()
          instance.trigger()
          expect(setStateSpy).not.toHaveBeenCalled()
          await wait(2)
          expect(setStateSpy).toHaveBeenCalled()
          expect(instance.state).toEqual({
            v: 5,
            loading: true,
            props: expect.any(Object),
          })
        })
      })
    })

    describe('cancelling', () => {
      const p = jest.fn(async () => {
        await wait(10)
        return 5
      })
      const consoleSpy = jest.spyOn(console, 'error')
      const test = <Test eventual={p} reducer={() => ({loading: true})} />
      let count = 0

      let render
      let instance
      let setStateSpy

      beforeEach(() => {
        p.mockClear()
        consoleSpy.mockClear()
        render = renderer.create(test)
        instance = render.getInstance()
        instance.constructor.displayName = `TestWithResetWarnings-${(count += 1)}`
        setStateSpy = jest.spyOn(instance, 'setState')
      })

      describe('raw setState', () => {
        it('triggers the React warning', () => {
          render.unmount()
          expect(consoleSpy).not.toHaveBeenCalled()
          instance.setState()
          expect(consoleSpy).toHaveBeenCalled()
          expect(consoleSpy.mock.calls[0][0]).toMatchSnapshot()
        })

        it('triggers the React warning with async', async () => {
          p().then(v => instance.setState({v}))
          await wait(2)
          render.unmount()
          expect(setStateSpy).not.toHaveBeenCalled()
          expect(consoleSpy).not.toHaveBeenCalled()
          await wait(10)
          expect(setStateSpy).toHaveBeenCalledWith({v: 5})
          expect(consoleSpy).toHaveBeenCalled()
          expect(consoleSpy.mock.calls[0][0]).toMatchSnapshot()
        })
      })

      describe('setFutureState', () => {
        it('doesn’t trigger the React warning', async () => {
          instance.trigger()
          await wait(2)
          render.unmount()
          expect(setStateSpy).not.toHaveBeenCalled()
          expect(consoleSpy).not.toHaveBeenCalled()
          await wait(10)
          expect(setStateSpy).not.toHaveBeenCalled()
          expect(consoleSpy).not.toHaveBeenCalled()
        })
      })
    })
  })
})
