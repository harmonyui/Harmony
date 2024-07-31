import { useCallback, useEffect, useMemo } from 'react'
import { decodeState, encodeState, useQueryState } from './query-state'

export function useQueryStorageState<T = undefined>(props: {
  key: string
  storage?: 'local' | 'session'
}): [T | undefined, (value: T | undefined) => void]
export function useQueryStorageState<T>(props: {
  key: string
  defaultValue: T
  storage?: 'local' | 'session'
}): [T, (value: T) => void]
export function useQueryStorageState<T>({
  key,
  defaultValue,
  storage = 'session',
}: {
  key: string
  defaultValue?: T
  storage?: 'local' | 'session'
}): [T | undefined, (value: T | undefined) => void] {
  const [value, setValue] = useQueryState({ key, defaultValue })

  const getStorage = () => {
    if (storage === 'local') {
      return localStorage
    }
    return sessionStorage
  }

  const setStorageValue = useCallback(
    (storageValue: T | undefined): void => {
      if (storageValue === undefined) {
        getStorage().removeItem(key)
      } else {
        getStorage().setItem(key, encodeState(storageValue))
      }

      setValue(storageValue)
    },
    [setValue],
  )

  useEffect(() => {
    if (defaultValue && !getStorage().getItem(key)) {
      setStorageValue(defaultValue)
    }
  }, [])

  //Prioritize the url, then the storage
  const storageValue = useMemo(() => {
    if (value) {
      return value
    }

    const storageValueString = getStorage().getItem(key)
    return storageValueString
      ? decodeState<T>(storageValueString)
      : defaultValue
  }, [value, defaultValue])

  return [storageValue, setStorageValue]
}
