/* eslint-disable @typescript-eslint/no-empty-function -- ok*/
import { useHarmonyContext } from '../../harmony-context'
import { usePinchGesture } from '../../harmony-provider'

interface WheelContainerProps {
  children: React.ReactNode
  sidePanel: React.ReactNode
  toolbarPanel: React.ReactNode
  overlay: React.ReactNode
}
export const WheelContainer: React.FunctionComponent<WheelContainerProps> = ({
  children,
  sidePanel,
  toolbarPanel,
  overlay,
}) => {
  const { scale, onScaleChange } = useHarmonyContext()
  const { onTouch } = usePinchGesture({
    scale,
    onTouching(newScale, cursorPos) {
      onScaleChange(newScale, cursorPos)
    },
  })
  const { onTouch: onTouchHeader } = usePinchGesture({ scale, onTouching() {} })

  return (
    <div
      className='hw-flex hw-h-full'
      ref={(ref) => {
        ref?.addEventListener('wheel', onTouchHeader)
      }}
    >
      {sidePanel}
      <div className='hw-relative hw-flex hw-flex-col hw-divide-y hw-divide-gray-200 hw-w-full hw-h-full hw-overflow-hidden hw-rounded-lg hw-bg-white hw-shadow-md'>
        <div data-name='harmony-panel'>{toolbarPanel}</div>
        <div
          id='harmony-scroll-container'
          ref={(ref) => {
            ref?.addEventListener('wheel', onTouch)
          }}
          className='hw-relative hw-flex hw-w-full hw-overflow-auto hw-flex-1 hw-px-4 hw-py-5 sm:hw-px-[250px] hw-bg-gray-200'
        >
          {children}
        </div>
        {overlay}
      </div>
    </div>
  )
}
