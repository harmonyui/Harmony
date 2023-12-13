export type AllOrNothing<T> =
  | T
  | {
      [P in keyof T]?: undefined;
    };

export type ReplaceWithName<T, K extends keyof T, Q> = Omit<T, K> & Q;
export type Replace<T, K extends keyof T, Q> = ReplaceWithName<
  T,
  K,
  Record<K, Q>
>;

export type RecordType<T> = { [P in keyof T]: T[P] };
