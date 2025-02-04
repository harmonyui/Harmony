import {
  AlignBottomIcon,
  AlignCenterVerticalIcon,
  AlignTopIcon,
  ArrowHorizontalIcon,
  ArrowVerticalIcon,
  EllipsisHorizontalIcon,
} from '@harmony/ui/src/components/core/icons'
import type { CSSProperties } from 'react'
import React, { useMemo } from 'react'
import type { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import { useComponentAttribute } from '../../../attributes/attribute-provider'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { Label } from './components/label'
import { AttributeButtonGroup } from './components/attribute-button-group'
import { DesignDropdown } from './components/design-dropdown'
import { AttributeExpand } from './components/attribute-expand'
import { ButtonGroup } from './components/button-group'
import { Button } from '@harmony/ui/src/components/core/button'

export const LayoutSection: DesignPanelSectionComponent = () => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()
  const displayAttribute = useMemo(
    () => getAttribute('display'),
    [getAttribute],
  )

  return (
    <Section label='Layout'>
      {displayAttribute === 'flex' ? (
        <div className='grid grid-cols-3 gap-y-2 items-center'>
          <Label label='Directions'>
            <AttributeButtonGroup
              attribute='flexDirection'
              items={[
                {
                  value: 'column',
                  children: <ArrowVerticalIcon className='h-4 w-4' />,
                },
                {
                  value: 'row',
                  children: <ArrowHorizontalIcon className='h-4 w-4' />,
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
                  children: <AlignTopIcon className='h-4 w-4' />,
                },
                {
                  value: 'center',
                  children: <AlignCenterVerticalIcon className='h-4 w-4' />,
                },
                {
                  value: 'flex-end',
                  children: <AlignBottomIcon className='h-4 w-4' />,
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
      ) : (
        <Button
          onClick={() => onAttributeChange({ name: 'display', value: 'flex' })}
        >
          Enable Layout
        </Button>
      )}
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
      className='col-span-2 w-full'
      items={justifyItems}
      initialValue={getAttribute('justifyContent')}
      onChange={(item) =>
        onAttributeChange({ name: 'justifyContent', value: item.id })
      }
    />
  )
}

const GapInput: React.FunctionComponent = () => {
  return (
    <AttributeExpand
      label='Gap'
      attribute='gap'
      expandedAttributes={['rowGap', 'columnGap']}
      additionalContent={({ isExpanded, setIsExpanded }) => (
        <ButtonGroup
          value={isExpanded ? 'expand' : ''}
          items={[
            {
              value: 'expand',
              children: <EllipsisHorizontalIcon className='w-4 h-4' />,
            },
          ]}
          onChange={() => setIsExpanded(!isExpanded)}
        />
      )}
    />
  )
}
