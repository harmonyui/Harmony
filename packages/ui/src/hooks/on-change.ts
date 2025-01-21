import { useEffect } from 'react'
import { usePrevious } from './previous'

export const useOnChange = <T>(
  value: T,
  handler: (prev: T | undefined, current: T) => void,
) => {
  const prev = usePrevious(value)
  useEffect(() => {
    if (prev !== value) {
      handler(prev, value)
    }
  }, [prev, value, handler])
}
