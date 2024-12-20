import type { IconComponent } from '@harmony/ui/src/components/core/icons'
import { getClass } from '@harmony/util/src/utils/common'
import { useComponentAttribute } from '../../../../attributes/attribute-provider'
import type { CommonTools } from '../../../../attributes/types'
import { useMultiValue } from '../hooks/multi-value'
import { useLink } from '../hooks/link'
import { DesignInput } from './design-input'
import { Label } from './label'
import { LinkButton } from './link-button'
import { TokenDropdown } from './token-dropdown'

interface AttributeExpandProps {
  attribute: CommonTools
  label?: string
  isExpanded: boolean
  expandedAttributes: CommonTools[]
  icons?: IconComponent[]
  additionalContent?: React.ReactNode
  spanFull?: boolean
}
export const AttributeExpand: React.FunctionComponent<AttributeExpandProps> = ({
  label,
  attribute,
  expandedAttributes,
  icons,
  isExpanded,
  additionalContent,
  spanFull = true,
}) => {
  const { onAttributeChange } = useComponentAttribute()
  const { isExpanded: isLinkExpanded, setIsExpanded: setIsLinkExpanded } =
    useLink(attribute)

  const { value: attrValue, values } = useMultiValue(
    attribute,
    expandedAttributes,
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
          <TokenDropdown attribute={attribute} />
        ) : (
          <DesignInput
            className='hw-w-full'
            value={attrValue}
            onChange={(value) => onAttributeChange({ name: attribute, value })}
          />
        )}
        {additionalContent}
        <LinkButton
          isExpanded={isLinkExpanded}
          setIsExpanded={setIsLinkExpanded}
        />
      </div>
      {isExpanded ? (
        <div className='hw-grid hw-grid-cols-2 hw-gap-2 hw-col-span-3'>
          {values.map((value, index) => {
            const Icon = icons ? icons[index] : null
            return (
              <div
                key={index}
                className='hw-col-span-1 hw-flex hw-gap-2 hw-items-center'
              >
                {Icon ? <Icon className='hw-h-4 hw-w-4' /> : null}
                {isLinkExpanded ? (
                  <TokenDropdown attribute={expandedAttributes[index]} />
                ) : (
                  <DesignInput
                    className='hw-w-full'
                    value={value}
                    onChange={(_value) =>
                      onAttributeChange({
                        name: expandedAttributes[index],
                        value: _value,
                      })
                    }
                  />
                )}
              </div>
            )
          })}
        </div>
      ) : null}
    </>
  )
}
