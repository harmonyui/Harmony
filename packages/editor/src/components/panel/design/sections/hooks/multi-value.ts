import { useMemo } from 'react'
import { useComponentAttribute } from '../../../../attributes/attribute-provider'
import type { CommonTools } from '../../../../attributes/types'

export const useMultiValue = (
  attribute: CommonTools,
  expandedAttributes: CommonTools[],
) => {
  const { getAttribute } = useComponentAttribute()

  const attrValue = useMemo(() => {
    const val = getAttribute(attribute)
    const split = val.split(' ')
    if (split.length > 1) {
      return `${Math.max(...split.map((v) => parseInt(v === 'normal' ? '0' : v)))}px`
    }

    return split[0]
  }, [attribute, getAttribute])

  const values = useMemo(() => {
    const val = getAttribute(attribute)
    const split = val.split(' ')
    const vals: string[] = []
    for (let i = 0; i < expandedAttributes.length; i++) {
      const v = split[i % split.length]
      vals.push(v === 'normal' ? '0px' : v)
    }
    return vals
  }, [attribute, getAttribute])

  return { value: attrValue, values }
}
