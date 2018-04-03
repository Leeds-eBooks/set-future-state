// @flow

describe('When WeakMap is not available', () => {
  it('throws', () => {
    // eslint-disable-next-line no-global-assign, no-native-reassign
    WeakMap = void 0
    expect(() => require('./set-future-state')).toThrowErrorMatchingSnapshot()
  })
})
