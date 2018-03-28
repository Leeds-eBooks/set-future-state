// @flow

type Cancel = () => void
type Nodeback<E, V> = (error: ?E, value?: V) => void

declare class Future<E, V> {
  map<M>(f: (value: V) => M): Future<E, M>;
  mapRej<M>(f: (error: E) => M): Future<M, V>;

  fork(onReject: (error: E) => *, onResolve: (value: V) => void): Cancel;
  done(callback: Nodeback<E, V>): Cancel;
}

declare module 'fluture' {
  declare export function isFuture(f: Future<*, *>): true
  declare export function isFuture(f: mixed): false

  declare export function tryP<V>(p: () => Promise<V>): Future<*, V>
  declare export function node<E, V>(
    n: (callback: Nodeback<E, V>) => void
  ): Future<E, V>

  declare export function encaseN<A, E, V>(
    n: (a: A, callback: Nodeback<E, V>) => void,
    a: A
  ): Future<E, V>
  declare export function encaseN<A, E, V>(
    n: (a: A, callback: Nodeback<E, V>) => void
  ): (a: A) => Future<E, V>

  declare export function of<V>(value: V): Future<null, V>
  declare export function after<V>(ms: number, value: V): Future<null, V>
  declare export function rejectAfter<E>(ms: number, error: E): Future<E, void>

  declare export function Future<E, V>(
    (reject: (error: E) => void, resolve: (value: V) => void) => ?Cancel
  ): Future<E, V>
}
