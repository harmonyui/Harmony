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
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50'>
          <div className='fixed flex flex-col inset-y-0 left-0 w-64 bg-white shadow z-50'>
            <div className='flex justify-between items-center p-4 border-b border-gray-200'>
              <div>{header}</div>
              <button onClick={onClose}>Close</button>
            </div>
            <div className='p-4 h-full'>{children}</div>
          </div>
        </div>,
        document.getElementById('harmony-container') || document.body,
      )
    : null
}
