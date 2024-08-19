import { useComponentAttribute } from '../attribute-provider'
import type { CommonTools } from '../types'
import { Section } from './components/section'
import { InputLabel } from './components/input-label'

export const SizeSection: React.FunctionComponent = () => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()

  const onChange = (name: CommonTools) => (value: string) =>
    onAttributeChange({ name, value })
  return (
    <Section label='Size'>
      <div className='hw-grid hw-grid-cols-4 hw-gap-y-4 hw-gap-x-2 hw-items-center'>
        <InputLabel
          label='Width'
          value={getAttribute('width')}
          onChange={onChange('width')}
        />
        <InputLabel
          label='Height'
          value={getAttribute('height')}
          onChange={onChange('height')}
        />
        <InputLabel
          label='Min W'
          value={getAttribute('minWidth')}
          onChange={onChange('minWidth')}
        />
        <InputLabel
          label='Min H'
          value={getAttribute('minHeight')}
          onChange={onChange('minHeight')}
        />
        <InputLabel
          label='Max W'
          value={getAttribute('maxWidth')}
          onChange={onChange('maxWidth')}
        />
        <InputLabel
          label='Max H'
          value={getAttribute('maxHeight')}
          onChange={onChange('maxHeight')}
        />
      </div>
    </Section>
  )
}
