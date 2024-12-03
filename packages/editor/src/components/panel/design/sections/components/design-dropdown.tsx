import { Dropdown } from '@harmony/ui/src/components/core/dropdown'
import { getClass } from '@harmony/util/src/utils/common'

export const DesignDropdown: typeof Dropdown = (props) => {
  return (
    <Dropdown
      {...props}
      className={getClass(
        'hw-border-transparent !hw-bg-gray-100 hover:!hw-bg-gray-200 hw-rounded-md hover:!hw-border-gray-300',
        props.className,
      )}
    />
  )
}
