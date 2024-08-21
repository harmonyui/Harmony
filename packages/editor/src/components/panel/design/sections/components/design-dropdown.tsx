import { Dropdown } from '@harmony/ui/src/components/core/dropdown'
import { getClass } from '@harmony/util/src/utils/common'

export const DesignDropdown: typeof Dropdown = (props) => {
  return (
    <Dropdown
      {...props}
      className={getClass('!hw-border-0', props.className)}
    />
  )
}
