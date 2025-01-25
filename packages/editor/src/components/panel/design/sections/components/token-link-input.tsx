import { useMemo } from 'react'
import { CommonTools } from '../../../../attributes/types'
import { useTokenLink } from '../hooks/token-link'
import { DesignInput } from './design-input'
import { TokenDropdown } from './token-dropdown'
import { useComponentAttribute } from '../../../../attributes/attribute-provider'
import { getClass } from '@harmony/util/src/utils/common'
import { LinkButton } from './link-button'

interface LinkInputProps {
  attribute: CommonTools
  className?: string
  hideButton?: boolean
}
export const TokenLinkInput: React.FunctionComponent<LinkInputProps> = ({
  attribute,
  className,
  hideButton = false,
}) => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()
  const { isExpanded, setIsExpanded, hasLink } = useTokenLink('borderRadius')
  const value = useMemo(() => getAttribute(attribute), [getAttribute])

  return (
    <div
      className={getClass('hw-flex hw-gap-1 hw-items-center hw-h-6', className)}
    >
      {isExpanded ? (
        <TokenDropdown attribute={attribute} />
      ) : (
        <DesignInput
          className='hw-w-full'
          value={value}
          onChange={(value) =>
            onAttributeChange({
              name: attribute,
              value: value,
            })
          }
        />
      )}
      {hasLink && !hideButton ? (
        <LinkButton isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      ) : null}
    </div>
  )
}
