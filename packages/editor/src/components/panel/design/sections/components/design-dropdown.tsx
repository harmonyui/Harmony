import { Dropdown } from '@harmony/ui/src/components/core/dropdown'
import { getClass } from '@harmony/util/src/utils/common'

export const DesignDropdown: typeof Dropdown = (props) => {
  return (
    <Dropdown
      {...props}
      className={getClass(
        '!hw-border-0 !hw-bg-gray-100 hover:!hw-bg-gray-200 hw-rounded-lg',
        props.className,
      )}
    />
  )
}
