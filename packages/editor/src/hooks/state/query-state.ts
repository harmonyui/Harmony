import type { PersistStorage } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import type { DisplayMode } from '../../components/harmony-context'
import { createHarmonySlice } from './factory'

type SymbolState<T> = Pick<
  T,
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ok
    [K in keyof T]: T[K] extends (...args: any) => any ? never : K
  }[keyof T]
>

const queryStorageState: PersistStorage<SymbolState<QueryState>> = {
  getItem: () => {
    const searchParams = new URL(window.location.href).searchParams
    const storedValue = searchParams.get('mode') as DisplayMode | null

    return {
      state: {
        displayMode: storedValue || 'designer',
      },
      version: 0,
    }
  },
  setItem: (_, newValue) => {
    const url = new URL(window.location.href)
    url.searchParams.set('mode', newValue.state.displayMode)
    const path = url.pathname + url.search + url.hash

    window.history.pushState(undefined, '', path)
  },
  removeItem: () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('mode')
    const path = url.pathname + url.search + url.hash
    window.history.pushState(undefined, '', path)
  },
}

export interface QueryState {
  displayMode: DisplayMode
  setDisplayMode: (mode: DisplayMode) => void
}

export const createQueryStateSlice = createHarmonySlice<QueryState>(
  persist(
    (set) => ({
      displayMode: 'designer',
      setDisplayMode: (mode) => set({ displayMode: mode }),
    }),
    {
      name: 'query-state',
      partialize: (state: QueryState) => ({ displayMode: state.displayMode }),
      storage: queryStorageState,
    },
  ),
)
