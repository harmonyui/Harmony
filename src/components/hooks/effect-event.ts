import { useMemo, useRef } from "react"

export const useEffectEvent = <T extends (...args: any[]) => any>(callback?: T) => {
  const callbackRef = useRef(callback)

  /**
   * same as modify ref value in `useEffect`, use for avoid tear of layout update
   */
  callbackRef.current = useMemo(() => callback, [callback])

  const stableRef = useRef<T>()

  // init once
  if (!stableRef.current) {
    stableRef.current = (
      function (this: ThisParameterType<T>, ...args) {
        return callbackRef.current?.apply(this, args)
      }
    ) as T
  }

  return stableRef.current as T
}