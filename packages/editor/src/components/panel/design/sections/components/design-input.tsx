import { InputBlur } from '@harmony/ui/src/components/core/input'
import { getClass } from '@harmony/util/src/utils/common'

export const DesignInput: typeof InputBlur = (props) => {
  return (
    <InputBlur
      {...props}
      className={getClass(
        '!hw-border-0 !hw-shadow-none hw-bg-gray-100 hw-h-6 hw-text-right',
        props.className,
      )}
    />
  )
}
