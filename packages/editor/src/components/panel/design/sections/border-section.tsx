import {
  BorderAllIcon,
  BorderBottomLeftIcon,
  BorderBottomRightIcon,
  BorderTopLeftIcon,
  BorderTopRightIcon,
  PaddingAllIcon,
  PaddingBottomIcon,
  PaddingLeftIcon,
  PaddingRightIcon,
  PaddingTopIcon,
} from '@harmony/ui/src/components/core/icons'
import { useState } from 'react'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { AttributeExpand } from './components/attribute-expand'
import { ButtonGroup } from './components/button-group'
import { ColorAttribute } from './components/color-attribute'

export const BorderSection: DesignPanelSectionComponent = () => {
  return (
    <Section label='Border'>
      <div className='hw-grid hw-grid-cols-3 hw-items-center hw-gap-2'>
        <RadiusSection />
        <StrokeSection />
        <ColorAttribute attribute='borderColor' />
      </div>
    </Section>
  )
}

const RadiusSection: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <AttributeExpand
      label='Radius'
      isExpanded={isExpanded}
      attribute='borderRadius'
      expandedAttributes={[
        'borderTopLeftRadius',
        'borderTopRightRadius',
        'borderBottomLeftRadius',
        'borderBottomRightRadius',
      ]}
      icons={[
        BorderTopLeftIcon,
        BorderTopRightIcon,
        BorderBottomLeftIcon,
        BorderBottomRightIcon,
      ]}
      additionalContent={
        <ButtonGroup
          items={[
            {
              value: 'expand',
              children: <BorderAllIcon className='hw-w-4 hw-h-4' />,
            },
          ]}
          value={isExpanded ? 'expand' : ''}
          onChange={() => setIsExpanded(!isExpanded)}
        />
      }
    />
  )
}

const StrokeSection: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <AttributeExpand
      label='Stroke'
      isExpanded={isExpanded}
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
      additionalContent={
        <ButtonGroup
          items={[
            {
              value: 'expand',
              children: <PaddingAllIcon className='hw-w-4 hw-h-4' />,
            },
          ]}
          value={isExpanded ? 'expand' : ''}
          onChange={() => setIsExpanded(!isExpanded)}
        />
      }
    />
  )
}
