import { useCallback, useEffect, useMemo } from 'react'
import { decodeState, encodeState, useQueryState } from './query-state'

type WriteMode = 'storage' | 'url' | 'both'

export function useQueryStorageState<T = undefined>(props: {
  key: string
  storage?: 'local' | 'session'
  writeMode?: WriteMode
}): [T | undefined, (value: T | undefined) => void]
export function useQueryStorageState<T>(props: {
  key: string
  defaultValue: T
  storage?: 'local' | 'session'
  writeMode?: WriteMode
}): [T, (value: T) => void]
export function useQueryStorageState<T>({
  key,
  defaultValue,
  storage = 'session',
  writeMode = 'both',
}: {
  key: string
  defaultValue?: T
  storage?: 'local' | 'session'
  writeMode?: WriteMode
}): [T | undefined, (value: T | undefined) => void] {
  const [value, setValue] = useQueryState({ key, defaultValue })

  const getStorage = () => {
    if (storage === 'local') {
      return localStorage
    }
    return sessionStorage
  }

  const putValueIntoStorage = useCallback((_value: T | undefined) => {
    if (_value === undefined) {
      getStorage().removeItem(key)
    } else {
      getStorage().setItem(key, encodeState(_value))
    }
  }, [])

  const setStorageValue = useCallback(
    (storageValue: T | undefined): void => {
      if (writeMode === 'storage' || writeMode === 'both') {
        putValueIntoStorage(storageValue)
      }

      if (writeMode === 'url' || writeMode === 'both') {
        setValue(storageValue)
      }
    },
    [setValue, putValueIntoStorage],
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
    if (typeof window === 'undefined') return defaultValue

    if (value) {
      putValueIntoStorage(value)
      return value
    }

    const storageValueString = getStorage().getItem(key)
    const retValue = storageValueString
      ? decodeState<T>(storageValueString)
      : defaultValue
    if (retValue !== value) setValue(retValue)
    return retValue
  }, [value, defaultValue, setValue])

  return [storageValue, setStorageValue]
}
