import { Button } from '@harmony/ui/src/components/core/button'
import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import {
  AlignBottomIcon,
  AlignCenterHorizonalIcon,
  AlignCenterVerticalIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  ArrowDownIcon,
  ArrowRightIcon,
} from '@harmony/ui/src/components/core/icons'
import { getClass } from '@harmony/util/src/utils/common'
import type { CommonTools } from '../types'
import { useComponentAttribute } from '../attribute-provider'
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { Label } from './components/label'

CSSPropertyRule

export const LayoutSection: DesignPanelSectionComponent = () => {
  return (
    <Section label='Layout'>
      <div className='hw-flex hw-flex-col hw-gap-4'>
        <LabelAttributeButtonGroup label='Flex Items'>
          <Label label='Directions'>
            <AttributeButtonGroup
              attribute='flexDirection'
              items={[
                {
                  value: 'column',
                  children: <ArrowDownIcon className='hw-h-4 hw-w-4' />,
                },
                {
                  value: 'row',
                  children: <ArrowRightIcon className='hw-h-4 hw-w-4' />,
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
                  children: (
                    <AlignCenterVerticalIcon className='hw-h-4 hw-w-4' />
                  ),
                },
                {
                  value: 'flex-end',
                  children: <AlignBottomIcon className='hw-h-4 hw-w-4' />,
                },
              ]}
            />
          </Label>
          <Label label='Justify'>
            <AttributeButtonGroup
              attribute='justifyContent'
              items={[
                {
                  value: 'flex-start',
                  children: <AlignLeftIcon className='hw-h-4 hw-w-4' />,
                },
                {
                  value: 'center',
                  children: (
                    <AlignCenterHorizonalIcon className='hw-h-4 hw-w-4' />
                  ),
                },
                {
                  value: 'flex-end',
                  children: <AlignRightIcon className='hw-h-4 hw-w-4' />,
                },
              ]}
            />
          </Label>
        </LabelAttributeButtonGroup>
        <LabelAttributeButtonGroup label='Content'>
          <Label label='Align'>
            <AttributeButtonGroup
              attribute='alignSelf'
              items={[
                {
                  value: 'flex-start',
                  children: <AlignTopIcon className='hw-h-4 hw-w-4' />,
                },
                {
                  value: 'center',
                  children: (
                    <AlignCenterVerticalIcon className='hw-h-4 hw-w-4' />
                  ),
                },
                {
                  value: 'flex-end',
                  children: <AlignBottomIcon className='hw-h-4 hw-w-4' />,
                },
              ]}
            />
          </Label>
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
        </LabelAttributeButtonGroup>
      </div>
    </Section>
  )
}

interface ButtonItem<P extends CommonTools> {
  children: React.ReactNode
  value: CSSProperties[P]
}
interface AttributeButtonGroupProps<P extends CommonTools> {
  items: ButtonItem<P>[]
  attribute: P
}
const AttributeButtonGroup = <P extends CommonTools>({
  items,
  attribute,
}: AttributeButtonGroupProps<P>) => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()
  const currentValue = useMemo(
    () => getAttribute(attribute),
    [getAttribute, attribute],
  )
  const onChange = (value: ButtonItem<P>['value']) => () =>
    onAttributeChange({ name: attribute, value: value as string })

  return (
    <div className='hw-p-2 hw-flex hw-gap-2 hw-rounded-lg hw-bg-[#E5E7EB] hw-col-span-2'>
      {items.map((item) => (
        <Button
          className={getClass(
            'hw-flex-1 !hw-border-0',
            item.value === currentValue
              ? 'hw-text-white *:hw-fill-[white]'
              : '',
          )}
          key={item.value}
          mode='other'
          backgroundColor={item.value === currentValue ? '#4B5563' : '#E5E7EB'}
          onClick={onChange(item.value)}
        >
          {item.children}
        </Button>
      ))}
    </div>
  )
}

const LabelAttributeButtonGroup = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => {
  return (
    <div>
      <label className='hw-text-[#1F2937] hw-text-[10px]'>{label}</label>
      <div className='hw-grid hw-grid-cols-3 hw-gap-y-2 hw-ml-4 hw-mt-4'>
        {children}
      </div>
    </div>
  )
}
