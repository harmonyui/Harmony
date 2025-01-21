import { createPortal } from 'react-dom'

interface SideDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  header: string
}
export const SideDrawer: React.FunctionComponent<SideDrawerProps> = ({
  isOpen,
  onClose,
  children,
  header,
}) => {
  return isOpen
    ? createPortal(
        <div className='hw-fixed hw-inset-0 hw-bg-black hw-bg-opacity-50 hw-z-50'>
          <div className='hw-fixed hw-flex hw-flex-col hw-inset-y-0 hw-left-0 hw-w-64 hw-bg-white hw-shadow hw-z-50'>
            <div className='hw-flex hw-justify-between hw-items-center hw-p-4 hw-border-b hw-border-gray-200'>
              <div>{header}</div>
              <button onClick={onClose}>Close</button>
            </div>
            <div className='hw-p-4 hw-h-full'>{children}</div>
          </div>
        </div>,
        document.getElementById('harmony-container') || document.body,
      )
    : null
}
