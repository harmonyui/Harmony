import { createPortal } from 'react-dom'
import { getClass } from '@harmony/util/src/utils/common'
import { ClosableContent } from './closable-content'
import { useFadeout } from '../../hooks/fadeout'

interface PopupProps {
  children: React.ReactNode
  show: boolean
  onClose: () => void
  fade?: boolean
  type?: InfoType
}
export const Popup: React.FunctionComponent<PopupProps> = ({
  show,
  onClose,
  children,
  fade = false,
  type = 'base',
}) => {
  const transparency = useFadeout({
    fade,
    onFaded() {
      onClose()
    },
  })

  return createPortal(
    show ? (
      <div className='fixed bottom-[40px] left-0 right-0 z-[100] h-fit'>
        <ClosableContent
          className='min-w-[400px] w-fit mx-auto fill-white'
          xMarkClassName={getClass(
            type === 'base' ? '' : 'fill-white',
            'h-2 w-2 mr-1 -mt-[14px]',
          )}
          onClose={onClose}
        >
          <InfoBox transparency={transparency} type={type}>
            {children}
          </InfoBox>
        </ClosableContent>
      </div>
    ) : null,
    document.getElementById('harmony-container') || document.body,
  )
}

export type InfoType = 'danger' | 'info' | 'base'
interface InfoBoxProps {
  children: React.ReactNode
  transparency?: number
  type?: InfoType
}
export const InfoBox: React.FunctionComponent<InfoBoxProps> = ({
  children,
  transparency,
  type = 'base',
}) => {
  const colors = {
    danger: 'bg-[#FF6565] text-white',
    info: 'bg-[#FFE9BE] text-[#11283B]',
    base: 'bg-white text-gray-900',
  }
  const color = colors[type]

  return (
    <div
      style={{ opacity: `${(transparency || 1) * 100}%` }}
      className={getClass('py-2 px-4 mb-4 text-sm rounded-lg', color)}
      role='alert'
    >
      {children}
    </div>
  )
}
