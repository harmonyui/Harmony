import { InputBlur } from '@harmony/ui/src/components/core/input'
import { getClass } from '@harmony/util/src/utils/common'

export const DesignInput: typeof InputBlur = (props) => {
  return (
    <InputBlur
      {...props}
      className={getClass(
        '!border-0 !shadow-none bg-gray-100 h-[30px] text-right text-xs',
        props.className,
      )}
    />
  )
}
