import { useComponentAttribute } from '../../../attributes/attribute-provider'
import type { CommonTools } from '../../../attributes/types'
import { Section } from './components/section'
import { InputLabel } from './components/input-label'
import { TokenLinkInput } from './components/token-link-input'
import { Label } from './components/label'
import { DropdownItem } from '@harmony/ui/src/components/core/dropdown'
import { useMemo } from 'react'
import { camelToKebab, kebabToWord } from '@harmony/util/src/utils/common'
import { Button } from '@harmony/ui/src/components/core/button'
import { XMarkIcon } from '@harmony/ui/src/components/core/icons'

export const SizeSection: React.FunctionComponent = () => {
  const { onAttributeChange, getTokenValues } = useComponentAttribute()

  const options: DropdownItem<CommonTools>[] = [
    {
      id: 'minWidth',
      name: 'Min Width',
    },
    {
      id: 'minHeight',
      name: 'Min Height',
    },
    {
      id: 'maxWidth',
      name: 'Max Width',
    },
    {
      id: 'maxHeight',
      name: 'Max Height',
    },
  ]

  const onOptionChange = (option: DropdownItem<CommonTools>) => {
    onAttributeChange({
      name: option.id,
      value: getTokenValues(option.id)[0]?.value ?? '0px',
    })
  }
  return (
    <Section label='Size' options={options} onOptionChange={onOptionChange}>
      <div className='hw-grid hw-grid-cols-3 hw-gap-y-2 hw-gap-x-2 hw-items-center hw-pt-1 hw-pr-1'>
        <Label label='Width'>
          <TokenLinkInput className='hw-col-span-2' attribute='width' />
        </Label>
        <Label label='Height'>
          <TokenLinkInput className='hw-col-span-2' attribute='height' />
        </Label>
        <RemovableInput attribute='minWidth' />
        <RemovableInput attribute='minHeight' />
        <RemovableInput attribute='maxWidth' />
        <RemovableInput attribute='maxHeight' />
      </div>
    </Section>
  )
}

const RemovableInput: React.FunctionComponent<{
  attribute: Extract<
    CommonTools,
    'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight'
  >
}> = ({ attribute }) => {
  const { getAttribute, onAttributeChange } = useComponentAttribute()
  const show = useMemo(
    () =>
      attribute.includes('min')
        ? getAttribute(attribute) !== 'auto'
        : getAttribute(attribute) !== 'none',
    [getAttribute],
  )

  const onRemove = () => {
    onAttributeChange({
      name: attribute,
      value: attribute.includes('min') ? 'auto' : 'none',
    })
  }
  return show ? (
    <Label label={kebabToWord(camelToKebab(attribute))}>
      <div className='hw-col-span-2 hw-flex hw-items-center hw-justify-between hw-gap-1'>
        <TokenLinkInput
          className='hw-col-span-2 hw-w-full'
          attribute={attribute}
        />
        <Button mode='none' onClick={onRemove}>
          <XMarkIcon className='hw-size-4' />
        </Button>
      </div>
    </Label>
  ) : null
}
