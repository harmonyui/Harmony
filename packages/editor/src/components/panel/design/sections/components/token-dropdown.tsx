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
      <div className='hw-flex hw-gap-2 hw-items-center'>
        <div
          className='hw-w-2.5 hw-h-2.5 hw-rounded-full hw-border hw-border-gray-300'
          style={{ backgroundColor: token.value }}
        />
        <div className='hw-text-xs'>{kebabToWord(token.name)}</div>
      </div>
    ) : (
      <div className='hw-flex hw-gap-2 hw-items-center hw-justify-between'>
        <div className='hw-text-xs'>{kebabToWord(token.name)}</div>
        <div className='hw-text-xs hw-text-gray-400'>
          {token.value.includes('rem')
            ? `${convertRemToPx(token.value)}px`
            : token.value}
        </div>
      </div>
    ),
  }))
  return (
    <DesignDropdown
      className={getClass('hw-w-full', className)}
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
