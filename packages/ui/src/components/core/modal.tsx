'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReplaceWithName } from '@harmony/util/src/types/utils'
import { createPortal } from 'react-dom'
import { getClass } from '@harmony/util/src/utils/common'
import { ClosableContent } from './closable-content'

interface ModalContextType {
  addModal: (newModal: React.ReactNode) => void
  removeModal: (toRemoveId: number) => void
  nextId: number
  container: HTMLElement | undefined
}
const ModalContext = createContext<ModalContextType>({
  addModal: () => undefined,
  removeModal: () => undefined,
  nextId: -1,
  container: undefined,
})
export const ModalProvider: React.FunctionComponent<
  React.PropsWithChildren
> = ({ children }) => {
  const [modals, setModals] = useState<React.ReactNode[]>([])
  const [container, setContainer] = useState<HTMLElement>()

  useEffect(() => {
    setContainer(document.body)
  }, [])

  const addModal = useCallback(
    (newModal: React.ReactNode): void => {
      const copy = modals.slice()
      copy.push(newModal)
      setModals(copy)
      if (container) container.style.overflow = 'hidden'
    },
    [modals],
  )

  const removeModal = useCallback(
    (toRemove: number): void => {
      const copy = modals.slice()
      const index = toRemove
      if (index < 0) throw new Error('Cannot remove modal')

      copy.splice(index)

      if (copy.length === 0 && container) {
        container.style.overflow = 'auto'
      }

      setModals(copy)
    },
    [modals],
  )

  return (
    <ModalContext.Provider
      value={{ addModal, removeModal, nextId: modals.length, container }}
    >
      {children}
      {modals.length > 0 ? (
        <div className='hw-fixed hw-top-0 hw-left-0 hw-w-full hw-z-50 hw-bg-gray-500/90 hw-h-screen hw-overflow-auto'>
          {modals}
        </div>
      ) : null}
    </ModalContext.Provider>
  )
}

interface ModalPortalProps {
  container?: HTMLElement
  children: React.ReactNode
  show: boolean
}
export const ModalPortal: React.FunctionComponent<ModalPortalProps> = ({
  children,
  show,
  container,
}) => {
  const _container = container || document.body //document.getElementById('harmony-section') ||

  return (
    <>
      {createPortal(
        show ? (
          <div className='hw-fixed hw-top-0 hw-left-0 hw-w-full hw-bg-gray-500/90 hw-h-screen hw-overflow-auto hw-z-[10000]'>
            {children}
          </div>
        ) : null,
        _container,
      )}
    </>
  )
}

export const useModal = (): ReplaceWithName<
  ModalContextType,
  'nextId' | 'removeModal',
  { removeModal: () => void }
> => {
  const { nextId, removeModal, ...rest } = useContext(ModalContext)
  const [id] = useState(nextId)
  const remove = (): void => {
    removeModal(id)
  }

  return { ...rest, removeModal: remove }
}

interface HarmonyModalProps {
  children: React.ReactNode
  show: boolean
  onClose: () => void
  editor?: boolean
  maxWidthClassName?: string
}
export const HarmonyModal: React.FunctionComponent<HarmonyModalProps> = ({
  children,
  show,
  onClose,
  maxWidthClassName,
  editor = false,
}) => {
  return (
    <ModalPortal
      show={show}
      container={
        editor
          ? document.getElementById('harmony-container') || undefined
          : undefined
      }
    >
      <div className='hw-flex hw-justify-center hw-items-center hw-h-full hw-w-full'>
        <ClosableContent
          className={getClass(
            'hw-mx-auto hw-w-full',
            maxWidthClassName || 'hw-max-w-3xl',
          )}
          onClose={onClose}
        >
          <div className='hw-bg-white hw-shadow sm:hw-rounded-lg'>
            <div className='hw-px-4 hw-py-5 sm:hw-p-6'>{children}</div>
          </div>
        </ClosableContent>
      </div>
    </ModalPortal>
  )
}

export const HarmonyModalShow: React.FunctionComponent<{
  children: React.ReactNode
  editor?: boolean
}> = ({ children, editor = false }) => {
  const [show, setShow] = useState(true)
  const onClose = () => {
    setShow(false)
  }

  return (
    <HarmonyModal show={show} onClose={onClose} editor={editor}>
      {children}
    </HarmonyModal>
  )
}
