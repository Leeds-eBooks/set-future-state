type Cancel = () => void

declare class Future<V> {
  fork(onReject: (error: Error) => void, onResolve: (value: V) => void): Cancel;
  done(callback: (error: ?Error, value?: V) => void): Cancel;
}

declare module 'fluture' {
  declare export function isFuture(f: Future<*>): true
  declare export function isFuture(f: mixed): false

  declare export function tryP<V>(p: () => Promise<V>): Future<V>

  declare export function of<V>(value: V): Future<V>
  declare export function after<V>(ms: number, value: V): Future<V>
  declare export function rejectAfter<V>(ms: number, error: Error): Future<void>

  declare export function Future<V>(
    (
      reject: (error?: Error | string) => void,
      resolve: (value: V) => void
    ) => ?Cancel
  ): Future<V>
}
