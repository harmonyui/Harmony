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
          'flex gap-2 items-center',
          spanFull ? 'col-span-2' : '',
        )}
      >
        {isLinkExpanded ? (
          <TokenDropdown attribute={attribute} valueOverride={attrValue} />
        ) : (
          <DesignInput
            className='w-full'
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
        <div className='grid grid-cols-2 gap-2 col-span-3'>
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
    <div className='col-span-1 flex gap-2 items-center'>
      {Icon ? <Icon className='h-4 w-4' /> : null}
      <TokenLinkInput
        className='w-full'
        attribute={expandedAttribute}
        hideButton
      />
    </div>
  )
}
