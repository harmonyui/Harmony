import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { getClass } from '@harmony/util/src/utils/common'
import { useComponentAttribute } from '../../../../attributes/attribute-provider'
import type { CommonTools } from '../../../../attributes/types'
import { useMultiValue } from '../hooks/multi-value'
import { useTokenLink } from '../hooks/token-link'
import { DesignInput } from './design-input'
import { Label } from './label'
import { LinkButton } from './link-button'
import { TokenDropdown } from './token-dropdown'
import { useMemoState } from '@harmony/ui/src/hooks/memo-state'
import { TokenLinkInput } from './token-link-input'

interface AttributeExpandProps {
  attribute: CommonTools
  label?: string
  expandedAttributes: CommonTools[]
  icons?: IconComponent[]
  additionalContent?: (props: {
    isExpanded: boolean
    setIsExpanded: (value: boolean) => void
  }) => React.ReactNode
  spanFull?: boolean
}
export const AttributeExpand: React.FunctionComponent<AttributeExpandProps> = ({
  label,
  attribute,
  expandedAttributes,
  icons,
  additionalContent,
  spanFull = true,
}) => {
  const { onAttributeChange } = useComponentAttribute()

  const {
    value: attrValue,
    values,
    hasMultiValue,
  } = useMultiValue(attribute, expandedAttributes)
  const {
    isExpanded: isLinkExpanded,
    setIsExpanded: setIsLinkExpanded,
    hasLink,
  } = useTokenLink(attribute, attrValue)
  const [isExpanded, setIsExpanded] = useMemoState(
    () => hasMultiValue,
    [hasMultiValue],
  )

  return (
    <>
      {label ? <Label label={label}>{null}</Label> : null}
      <div
        className={getClass(
          'hw-flex hw-gap-2 hw-items-center',
          spanFull ? 'hw-col-span-2' : '',
        )}
      >
        {isLinkExpanded ? (
          <TokenDropdown attribute={attribute} valueOverride={attrValue} />
        ) : (
          <DesignInput
            className='hw-w-full'
            value={attrValue}
            onChange={(value) => onAttributeChange({ name: attribute, value })}
          />
        )}
        {additionalContent?.({ isExpanded, setIsExpanded })}
        {hasLink ? (
          <LinkButton
            isExpanded={isLinkExpanded}
            setIsExpanded={setIsLinkExpanded}
          />
        ) : null}
      </div>
      {isExpanded ? (
        <div className='hw-grid hw-grid-cols-2 hw-gap-2 hw-col-span-3'>
          {values.map((value, index) => {
            const Icon = icons ? icons[index] : null
            return (
              <AttributedExpanded
                key={index}
                Icon={Icon}
                expandedAttribute={expandedAttributes[index]}
              />
            )
          })}
        </div>
      ) : null}
    </>
  )
}

interface AttributeExpandedProps {
  Icon: IconComponent | null
  expandedAttribute: CommonTools
}
const AttributedExpanded: React.FunctionComponent<AttributeExpandedProps> = ({
  Icon,
  expandedAttribute,
}) => {
  return (
    <div className='hw-col-span-1 hw-flex hw-gap-2 hw-items-center'>
      {Icon ? <Icon className='hw-h-4 hw-w-4' /> : null}
      <TokenLinkInput
        className='hw-w-full'
        attribute={expandedAttribute}
        hideButton
      />
    </div>
  )
}
