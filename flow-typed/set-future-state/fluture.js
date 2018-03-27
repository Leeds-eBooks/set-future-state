// @flow

type Cancel = () => void

declare class Future<E, V> {
  mapRej<M>(f: (error: E) => M): Future<M, V>;

  fork(onReject: (error: E) => *, onResolve: (value: V) => void): Cancel;
  done(callback: (error: ?E, value?: V) => void): Cancel;
}

declare module 'fluture' {
  declare export function isFuture(f: Future<*, *>): true
  declare export function isFuture(f: mixed): false

  declare export function tryP<V>(p: () => Promise<V>): Future<*, V>
  declare export function encaseN<A, E, V>(
    n: (a: A, callback: (error: ?E, value?: V) => void) => void
  ): (a: A) => Future<E, V>

  declare export function of<V>(value: V): Future<null, V>
  declare export function after<V>(ms: number, value: V): Future<null, V>
  declare export function rejectAfter<E>(ms: number, error: E): Future<E, void>

  declare export function Future<E, V>(
    (reject: (error: E) => void, resolve: (value: V) => void) => ?Cancel
  ): Future<E, V>
}
