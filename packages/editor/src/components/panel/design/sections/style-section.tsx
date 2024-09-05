import type { DesignPanelSectionComponent } from './components/section'
import { Section } from './components/section'
import { ColorAttribute } from './components/color-attribute'
import { AttributeButtonGroup } from './components/attribute-button-group'
import { Label } from './components/label'

export const StyleSection: DesignPanelSectionComponent = () => {
  return (
    <Section label='Style'>
      <div className='hw-grid hw-grid-cols-3 hw-gap-2 hw-items-center hw-pt-1'>
        <ColorAttribute className='hw-col-span-3' attribute='backgroundColor' />
        <Label label='Overflow'>
          <AttributeButtonGroup
            attribute='overflow'
            items={[
              {
                value: 'hidden',
                children: 'Hidden',
              },
              {
                value: 'visible',
                children: 'Visible',
              },
            ]}
          />
        </Label>
        <ShowSection />
      </div>
    </Section>
  )
}

const ShowSection: React.FunctionComponent = () => {
  return (
    <Label label='Show'>
      <AttributeButtonGroup
        attribute='display'
        items={[
          {
            value: 'inherit',
            children: 'Yes',
          },
          {
            value: 'none',
            children: 'No',
          },
        ]}
      />
    </Label>
  )
}
