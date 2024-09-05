import {
  AlignBottomIcon,
  AlignCenterVerticalIcon,
  AlignTopIcon,
  ArrowHorizontalIcon,
  ArrowVerticalIcon,
} from '@harmony/ui/src/components/core/icons'
import type { CSSProperties } from 'react'
import React, { useState } from 'react'
import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import { useComponentAttribute } from '../attribute-provider'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { Label } from './components/label'
import { AttributeButtonGroup } from './components/attribute-button-group'
import { DesignDropdown } from './components/design-dropdown'
import { AttributeExpand } from './components/attribute-expand'
import { ButtonGroup } from './components/button-group'

CSSPropertyRule

export const LayoutSection: DesignPanelSectionComponent = () => {
  return (
    <Section label='Layout'>
      <div className='hw-grid hw-grid-cols-3 hw-gap-y-2 hw-items-center'>
        <Label label='Directions'>
          <AttributeButtonGroup
            attribute='flexDirection'
            items={[
              {
                value: 'column',
                children: <ArrowVerticalIcon className='hw-h-4 hw-w-4' />,
              },
              {
                value: 'row',
                children: <ArrowHorizontalIcon className='hw-h-4 hw-w-4' />,
              },
            ]}
          />
        </Label>
        <Label label='Align'>
          <AttributeButtonGroup
            attribute='alignItems'
            items={[
              {
                value: 'flex-start',
                children: <AlignTopIcon className='hw-h-4 hw-w-4' />,
              },
              {
                value: 'center',
                children: <AlignCenterVerticalIcon className='hw-h-4 hw-w-4' />,
              },
              {
                value: 'flex-end',
                children: <AlignBottomIcon className='hw-h-4 hw-w-4' />,
              },
            ]}
          />
        </Label>
        <Label label='Justify'>
          <JustifyDropdown />
        </Label>
        <GapInput />
        <Label label='Wrap'>
          <AttributeButtonGroup
            attribute='flexWrap'
            items={[
              {
                value: 'wrap',
                children: 'Yes',
              },
              {
                value: 'nowrap',
                children: 'No',
              },
            ]}
          />
        </Label>
      </div>
    </Section>
  )
}

const JustifyDropdown: React.FunctionComponent = () => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()

  const justifyItems: DropdownItem<
    Exclude<CSSProperties['justifyContent'], undefined>
  >[] = [
    {
      id: 'normal',
      name: 'Default',
    },
    {
      id: 'flex-start',
      name: 'Start',
    },
    {
      id: 'center',
      name: 'Center',
    },
    {
      id: 'flex-end',
      name: 'End',
    },
    {
      id: 'space-between',
      name: 'Space Between',
    },
    {
      id: 'space-around',
      name: 'Space Around',
    },
    {
      id: 'space-evenly',
      name: 'Space Evenly',
    },
  ]

  return (
    <DesignDropdown
      className='hw-col-span-2 hw-w-full'
      items={justifyItems}
      initialValue={getAttribute('justifyContent')}
      onChange={(item) =>
        onAttributeChange({ name: 'justifyContent', value: item.id })
      }
    />
  )
}

const GapInput: React.FunctionComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <AttributeExpand
      label='Gap'
      attribute='gap'
      isExpanded={isExpanded}
      expandedAttributes={['rowGap', 'columnGap']}
      additionalContent={
        <ButtonGroup
          value={isExpanded ? 'expand' : ''}
          items={[
            {
              value: 'expand',
              children: 'Expand',
            },
          ]}
          onChange={() => setIsExpanded(!isExpanded)}
        />
      }
    />
  )
}
