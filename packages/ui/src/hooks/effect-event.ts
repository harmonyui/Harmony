/* eslint-disable @typescript-eslint/no-unsafe-return -- ok*/
/* eslint-disable @typescript-eslint/no-explicit-any -- ok*/
import { useMemo, useRef } from 'react'

export const useEffectEvent = <T extends (...args: any[]) => any>(
  callback?: T,
) => {
  const callbackRef = useRef(callback)

  /**
   * same as modify ref value in `useEffect`, use for avoid tear of layout update
   */
  callbackRef.current = useMemo(() => callback, [callback])

  const stableRef = useRef<T>(undefined)

  // init once
  if (!stableRef.current) {
    stableRef.current = function curr(this: ThisParameterType<T>, ...args) {
      return callbackRef.current?.apply(this, args)
    } as T
  }

  return stableRef.current
}
