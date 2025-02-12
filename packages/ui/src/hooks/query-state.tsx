'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/** Stores state as search parameter json values in the url */
export function useQueryState<T = undefined>(props: {
  key: string
}): [T | undefined, (value: T | undefined) => void]
export function useQueryState<T>(props: {
  key: string
  defaultValue: T
}): [T, (value: T) => void]
export function useQueryState<T>({
  key,
  defaultValue,
}: {
  key: string
  defaultValue?: T
}): [T | undefined, (value: T | undefined) => void] {
  const { setSearchParam, deleteSearchParam, searchParams } =
    useContext(QueryStateContext)

  const setUrlValue = (value: T | undefined): void => {
    const encodedValue = encodeState(value)
    //If stuff is empty, remove it from the url
    if (
      value === undefined ||
      value === '' ||
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    ) {
      deleteSearchParam(key)
    } else {
      setSearchParam(key, encodedValue)
    }
  }

  useEffect(() => {
    if (defaultValue && !searchParams?.get(key)) {
      setUrlValue(defaultValue)
    }
  }, [])

  const value: T | undefined = useMemo(() => {
    if (typeof window === 'undefined') return defaultValue

    if (!searchParams)
      throw new Error('Must use QueryStateProvider to use useQueryState')
    const val = searchParams.get(key)
    return val ? decodeState<T>(val) : defaultValue
  }, [key, searchParams, defaultValue])

  return [value, setUrlValue]
}

interface QueryStateContextType {
  url: string
  searchParams?: URLSearchParams
  setSearchParam: (key: string, value: string) => void
  deleteSearchParam: (key: string) => void
}
const QueryStateContext = createContext<QueryStateContextType>({
  url: '',
  searchParams: undefined,
  setSearchParam: () => undefined,
  deleteSearchParam: () => undefined,
})

export const QueryStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const urlRef = useRef(
    typeof window !== 'undefined' ? window.location.href : undefined,
  )
  const [forceRerender, setForceRerender] = useState(0)
  const router = typeof window !== 'undefined' ? window.location : undefined

  const searchParams = useMemo(
    () => (urlRef.current ? new URL(urlRef.current).searchParams : undefined),
    [urlRef.current],
  )

  const setUrl = useCallback(
    (newUrl: string) => {
      const url = new URL(newUrl)
      //Removes dependency on the path so that only the search params are updated
      url.pathname = window.location.pathname

      const hasChanged = url.href !== urlRef.current
      urlRef.current = url.href
      hasChanged && setForceRerender((prev) => prev + 1)
    },
    [urlRef, setForceRerender],
  )

  const setSearchParam = useCallback(
    (key: string, value: string) => {
      if (!urlRef.current) return

      const url = new URL(urlRef.current)
      url.searchParams.set(key, value)
      setUrl(url.href)
    },
    [urlRef, setUrl],
  )

  const deleteSearchParam = useCallback(
    (key: string) => {
      if (!urlRef.current) return

      const url = new URL(urlRef.current)
      url.searchParams.delete(key)
      setUrl(url.href)
    },
    [urlRef, setUrl],
  )

  //Whenever the urlRef changes, update the url
  useEffect(() => {
    if (urlRef.current && window.location.href !== urlRef.current) {
      const url = new URL(urlRef.current)
      const path = url.pathname + url.search + url.hash
      window.history.pushState({}, '', path)
    }
  }, [urlRef, forceRerender, router])

  //Keep the urlRef up to date with the current url
  useEffect(() => {
    if (window.location.href !== urlRef.current) {
      urlRef.current = window.location.href
    }
  }, [searchParams])

  return (
    <QueryStateContext.Provider
      value={{
        url: urlRef.current ?? '',
        setSearchParam,
        deleteSearchParam,
        searchParams,
      }}
    >
      {children}
    </QueryStateContext.Provider>
  )
}

export const encodeState = <T,>(state: T): string => {
  if (typeof state === 'string') {
    return state
  }

  return JSON.stringify(state)
}

export const decodeState = <T,>(state: string): T => {
  try {
    return JSON.parse(state) as T
  } catch {
    //If it fails to parse, then it is probably a string
    return state as T
  }
}
