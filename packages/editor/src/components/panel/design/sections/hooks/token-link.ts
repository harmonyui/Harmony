import { useMemo } from 'react'
import { useComponentAttribute } from '../../../../attributes/attribute-provider'
import type { CommonTools } from '../../../../attributes/types'
import { useMemoState } from '@harmony/ui/src/hooks/memo-state'

export const useTokenLink = (name: CommonTools, valueOverride?: string) => {
  const { getCurrentToken, getTokenValues } = useComponentAttribute()
  const tokenValue = useMemo(
    () => getCurrentToken(name, valueOverride),
    [getCurrentToken, name, valueOverride],
  )
  const tokenValues = useMemo(
    () => getTokenValues(name),
    [getTokenValues, name],
  )
  const [isExpanded, setIsExpanded] = useMemoState<boolean>(
    () => tokenValue !== undefined && tokenValues.length > 0,
    [tokenValue, tokenValues],
  )

  const hasLink = useMemo(() => tokenValues.length > 0, [tokenValues])

  return {
    isExpanded,
    setIsExpanded,
    hasLink,
  }
}
