import { useState } from 'react'
import {
  PaddingAllIcon,
  PaddingBottomIcon,
  PaddingLeftIcon,
  PaddingRightIcon,
  PaddingTopIcon,
} from '@harmony/ui/src/components/core/icons'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { AttributeExpand } from './components/attribute-expand'
import { ButtonGroup } from './components/button-group'

export const SpacingSection: DesignPanelSectionComponent = () => {
  return (
    <Section label='Spacing'>
      <div className='hw-grid hw-grid-cols-3 hw-items-center hw-gap-2'>
        <PaddingSection />
        <MarginSection />
      </div>
    </Section>
  )
}

const PaddingSection: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <AttributeExpand
      label='Padding'
      isExpanded={isExpanded}
      attribute='padding'
      expandedAttributes={[
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
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

const MarginSection: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <AttributeExpand
      label='Margin'
      isExpanded={isExpanded}
      attribute='margin'
      expandedAttributes={[
        'marginTop',
        'marginRight',
        'marginBottom',
        'marginLeft',
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
