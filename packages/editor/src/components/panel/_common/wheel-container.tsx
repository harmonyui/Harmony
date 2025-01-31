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
  const { scale } = useHarmonyContext()
  const { onTouch } = usePinchGesture({
    scale,
    onTouching() {
      //onScaleChange(newScale, cursorPos)
    },
  })
  const { onTouch: onTouchHeader } = usePinchGesture({ scale, onTouching() {} })

  return (
    <div
      className='flex h-full'
      ref={(ref) => {
        ref?.addEventListener('wheel', onTouchHeader)
      }}
    >
      {sidePanel}
      <div className='relative flex flex-col divide-y divide-gray-200 w-full h-full overflow-hidden rounded-lg bg-white shadow-md'>
        <div data-name='harmony-panel'>{toolbarPanel}</div>
        <div
          id='harmony-scroll-container'
          ref={(ref) => {
            ref?.addEventListener('wheel', onTouch)
          }}
          className='relative flex w-full overflow-auto flex-1 px-4 py-5 sm:px-[250px] bg-gray-200'
        >
          {children}
        </div>
        {overlay}
      </div>
    </div>
  )
}
