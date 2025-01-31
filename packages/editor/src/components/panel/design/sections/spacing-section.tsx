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
      <div className='grid grid-cols-3 items-center gap-2'>
        <PaddingSection />
        <MarginSection />
      </div>
    </Section>
  )
}

const PaddingSection: React.FunctionComponent = () => {
  return (
    <AttributeExpand
      label='Padding'
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

const MarginSection: React.FunctionComponent = () => {
  return (
    <AttributeExpand
      label='Margin'
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
