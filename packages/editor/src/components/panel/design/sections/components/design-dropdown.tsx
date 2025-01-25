import { Dropdown } from '@harmony/ui/src/components/core/dropdown'
import { getClass } from '@harmony/util/src/utils/common'

export const DesignDropdown: typeof Dropdown = (props) => {
  return (
    <Dropdown
      {...props}
      className={getClass('hw-rounded-md', props.className)}
      buttonClass='hw-w-full hw-border-transparent !hw-bg-gray-100 hover:!hw-bg-gray-200 hover:!hw-border-gray-300'
      container={document.getElementById('harmony-container') || undefined}
    />
  )
}
