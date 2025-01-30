import {
  PaddingAllIcon,
  PaddingBottomIcon,
  PaddingLeftIcon,
  PaddingRightIcon,
  PaddingTopIcon,
} from '@harmony/ui/src/components/core/icons'
import { useComponentAttribute } from '../../../attributes/attribute-provider'
import type { CommonTools } from '../../../attributes/types'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { AttributeExpand } from './components/attribute-expand'
import { ButtonGroup } from './components/button-group'
import { ColorAttribute } from './components/color-attribute'
import { Label } from './components/label'
import { TokenDropdown } from './components/token-dropdown'
import { useTokenLink } from './hooks/token-link'
import { LinkButton } from './components/link-button'
import { useMultiValue } from './hooks/multi-value'
import { DesignInput } from './components/design-input'

export const BorderSection: DesignPanelSectionComponent = () => {
  return (
    <Section label='Border'>
      <div className='grid grid-cols-3 items-center gap-2'>
        <RadiusSection />
        <StrokeSection />
        <ColorAttribute attribute='borderColor' />
      </div>
    </Section>
  )
}

const borderRadiusNames: CommonTools[] = [
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
]
const RadiusSection: React.FunctionComponent = () => {
  const { onAttributeChange } = useComponentAttribute()
  const { isExpanded, setIsExpanded } = useTokenLink('borderRadius')
  const { value: attrValue } = useMultiValue('borderRadius', borderRadiusNames)

  return (
    <>
      <Label label='Corners'>
        <div className='flex gap-1 items-center col-span-2'>
          {isExpanded ? (
            <div className='col-span-2 flex gap-2 items-center flex-1'>
              <TokenDropdown attribute='borderRadius' />
            </div>
          ) : (
            <>
              <div className='flex gap-2 items-center'>
                <DesignInput
                  className='w-full'
                  value={attrValue}
                  onChange={(value) =>
                    onAttributeChange({ name: 'borderRadius', value })
                  }
                />
              </div>
            </>
          )}
          <LinkButton isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        </div>
      </Label>
    </>
  )
}

const StrokeSection: React.FunctionComponent = () => {
  return (
    <AttributeExpand
      label='Stroke'
      attribute='borderWidth'
      expandedAttributes={[
        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth',
      ]}
      icons={[
        PaddingTopIcon,
        PaddingRightIcon,
        PaddingBottomIcon,
        PaddingLeftIcon,
      ]}
      additionalContent={({ isExpanded, setIsExpanded }) => (
        <ButtonGroup
          items={[
            {
              value: 'expand',
              children: <PaddingAllIcon className='w-4 h-4' />,
            },
          ]}
          value={isExpanded ? 'expand' : ''}
          onChange={() => setIsExpanded(!isExpanded)}
        />
      )}
    />
  )
}
