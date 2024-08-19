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
import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { Label } from './components/label'
import { AttributeButtonGroup } from './components/attribute-button-group'

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
