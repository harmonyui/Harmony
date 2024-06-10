/* eslint-disable @typescript-eslint/no-explicit-any -- ok*/
import type { StateCreator } from "zustand";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type HarmonyPipeCreator<State, Dependencies> = {[P in keyof (State & Dependencies)]?: (values: (State & Dependencies)[P]) => void}
export type HarmonyStateCreator<State> = State

export type HarmonySlice<State, Dependencies = unknown> = (...params: Parameters<StateCreator<State & Dependencies>>) => HarmonyStateCreator<State extends {state: any, dependencies?: any} ? never : State> | {
    state: HarmonyStateCreator<State>,
    dependencies?: HarmonyPipeCreator<State, Dependencies>
}

export const createHarmonySlice = <State, Dependencies = unknown>(slice: HarmonySlice<State, Dependencies>): HarmonySlice<State, Dependencies> => slice;

export const createHarmonyStore = <A extends HarmonySlice<any, any>[] & CheckState<A>>(..._slices: [...A]) => {
    type State = SpreadState<A>
    type Dependencies = SpreadDependencies<A>
    type StoreState = State & Dependencies;
    const slices = _slices as HarmonySlice<Partial<State>, Partial<State>>[];
    const dependencies: HarmonyPipeCreator<Partial<State>, Partial<State>>[] = [];
    const store = create<StoreState>()(subscribeWithSelector<StoreState>((...a) => (slices.reduce<Partial<StoreState>>((prev, curr) => {
      const result = curr(...a);
      const currState = 'state' in result ? result.state : result;
      if ('dependencies' in result && result.dependencies) {
        dependencies.push(result.dependencies)
      }
      
      return {
          ...prev,
          ...currState
      }
    }, {}) as StoreState)));

    dependencies.forEach((pipeState) => {
      for (const _key in pipeState) {
          const key = _key as keyof typeof pipeState;
          const pipeFunc = pipeState[key];

          pipeFunc && store.subscribe(state => state[key], pipeFunc);
      }
    })

    return store;
}

type OptionalPropertyNames<T> =
  { [K in keyof T]-?: (object extends { [P in K]: T[K] } ? K : never) }[keyof T];

type SpreadProperties<L, R, K extends keyof L & keyof R> =
  { [P in K]: L[P] | Exclude<R[P], undefined> };

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

type SpreadTwo<L, R> = Id<
  & Pick<L, Exclude<keyof L, keyof R>>
  & Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>>
  & Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>>
  & SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;

type ExtractState<L> = L extends HarmonySlice<infer State, any> ? State : never
type ExtractDependencies<L> = L extends HarmonySlice<any, infer Dependencies> ? Dependencies : never

type SpreadState<A extends readonly [...any]> = A extends [infer L, ...infer R] ?
  SpreadTwo<ExtractState<L>, SpreadState<R>> : unknown
type SpreadDependencies<A extends readonly [...any]> = A extends [infer L, ...infer R] ?
  SpreadTwo<ExtractDependencies<L>, SpreadState<R>> : unknown

type CheckState<A extends HarmonySlice<any, any>[]> = SpreadState<A> extends SpreadDependencies<A> ? unknown : never