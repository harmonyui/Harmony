import { useMemo } from 'react'
import { useComponentAttribute } from '../../../../attributes/attribute-provider'
import type { CommonTools } from '../../../../attributes/types'

export const useMultiValue = (
  attribute: CommonTools,
  expandedAttributes: CommonTools[],
) => {
  const { getAttribute } = useComponentAttribute()

  const value = useMemo(() => getAttribute(attribute), [getAttribute])

  const attrValue = useMemo(() => {
    const split = value.split(' ')
    if (split.length > 1) {
      return `${Math.max(...split.map((v) => parseInt(v === 'normal' ? '0' : v)))}px`
    }

    return split[0]
  }, [attribute, getAttribute, value])

  const values = useMemo(() => {
    const split = value.split(' ')
    const vals: string[] = []
    for (let i = 0; i < expandedAttributes.length; i++) {
      const v = split[i % split.length]
      vals.push(v === 'normal' ? '0px' : v)
    }
    return vals
  }, [attribute, getAttribute, value, expandedAttributes])

  const hasMultiValue = useMemo(() => value.split(' ').length > 1, [value])

  return { value: attrValue, values, hasMultiValue }
}
