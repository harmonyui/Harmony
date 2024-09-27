import { useCallback, useEffect, useMemo, useState } from 'react'
import { decodeState, encodeState } from './query-state'

export function useStorageState<T = undefined>(props: {
  key: string
  storage?: 'local' | 'session'
}): [T | undefined, (value: T | undefined) => void]
export function useStorageState<T>(props: {
  key: string
  defaultValue: T
  storage?: 'local' | 'session'
}): [T, (value: T) => void]
export function useStorageState<T>({
  key,
  defaultValue,
  storage = 'session',
}: {
  key: string
  defaultValue?: T
  storage?: 'local' | 'session'
}): [T | undefined, (value: T | undefined) => void] {
  const [counter, setCounter] = useState(0)

  const getStorage = () => {
    if (storage === 'local') {
      return localStorage
    }
    return sessionStorage
  }

  const putValueIntoStorage = useCallback(
    (_value: T | undefined) => {
      if (_value === undefined) {
        getStorage().removeItem(key)
      } else {
        getStorage().setItem(key, encodeState(_value))
      }
      setCounter((prev) => prev + 1)
    },
    [setCounter],
  )

  const setStorageValue = useCallback(
    (storageValue: T | undefined): void => {
      putValueIntoStorage(storageValue)

      //setValue(storageValue)
    },
    [putValueIntoStorage],
  )

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      defaultValue &&
      !getStorage().getItem(key)
    ) {
      setStorageValue(defaultValue)
    }
  }, [])

  //Prioritize the url, then the storage
  const storageValue = useMemo(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    const storageValueString = getStorage().getItem(key)
    const retValue = storageValueString
      ? decodeState<T>(storageValueString)
      : defaultValue
    //setValue(retValue)
    return retValue
  }, [counter, defaultValue])

  return [storageValue, setStorageValue]
}
