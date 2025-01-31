import { Dropdown } from '@harmony/ui/src/components/core/dropdown'
import { getClass } from '@harmony/util/src/utils/common'

export const DesignDropdown: typeof Dropdown = (props) => {
  return (
    <Dropdown
      {...props}
      className={getClass('rounded-md', props.className)}
      buttonClass='w-full border-transparent !bg-gray-100 hover:!bg-gray-200 hover:!border-gray-300'
      container={document.getElementById('harmony-container') || undefined}
    />
  )
}
