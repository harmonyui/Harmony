import { getClass, kebabToWord } from '@harmony/util/src/utils/common'
import { useMemo } from 'react'
import { useComponentAttribute } from '../../../../attributes/attribute-provider'
import { colorTools, type CommonTools } from '../../../../attributes/types'
import { DesignDropdown } from './design-dropdown'
import { convertRemToPx } from '../../utils'

export const TokenDropdown: React.FunctionComponent<{
  attribute: CommonTools
  valueOverride?: string
  className?: string
}> = ({ attribute, className, valueOverride }) => {
  const { onAttributeChange, getCurrentToken, getTokenValues } =
    useComponentAttribute()
  const tokenValue = useMemo(
    () => getCurrentToken(attribute, valueOverride),
    [getCurrentToken, valueOverride],
  )
  const tokenValues = useMemo(() => getTokenValues(attribute), [getTokenValues])
  const items = tokenValues.map((token) => ({
    id: token.value,
    name: (colorTools as readonly string[]).includes(attribute) ? (
      <div className='flex gap-2 items-center'>
        <div
          className='w-2.5 h-2.5 rounded-full border border-gray-300'
          style={{ backgroundColor: token.value }}
        />
        <div className='text-xs'>{kebabToWord(token.name)}</div>
      </div>
    ) : (
      <div className='flex gap-2 items-center justify-between'>
        <div className='text-xs'>{kebabToWord(token.name)}</div>
        <div className='text-xs text-gray-400'>
          {token.value.includes('rem')
            ? `${convertRemToPx(token.value)}px`
            : token.value}
        </div>
      </div>
    ),
  }))
  return (
    <DesignDropdown
      className={getClass('w-full', className)}
      items={items}
      initialValue={tokenValue?.value}
      onChange={(value) =>
        onAttributeChange({ name: attribute, value: value.id })
      }
      container={document.getElementById('harmony-container') || undefined}
    >
      Select
    </DesignDropdown>
  )
}
