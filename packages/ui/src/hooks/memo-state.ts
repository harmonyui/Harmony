import { useEffect, useState } from 'react'

export const useMemoState = <T>(
  fn: () => T,
  deps: React.DependencyList,
): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>(fn())

  useEffect(() => {
    setValue(fn())
  }, [...deps])

  return [value, setValue]
}
