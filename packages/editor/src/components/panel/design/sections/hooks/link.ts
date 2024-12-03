import { useMemo, useState } from 'react'
import { useComponentAttribute } from '../../attribute-provider'
import type { CommonTools } from '../../types'

export const useLink = (name: CommonTools) => {
  const { getCurrentToken, getTokenValues } = useComponentAttribute()
  const tokenValue = useMemo(
    () => getCurrentToken(name),
    [getCurrentToken, name],
  )
  const tokenValues = useMemo(
    () => getTokenValues(name),
    [getTokenValues, name],
  )
  const [isExpanded, setIsExpanded] = useState<boolean>(
    tokenValue !== undefined && tokenValues.length > 0,
  )

  return {
    isExpanded,
    setIsExpanded,
  }
}
