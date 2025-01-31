import { Transition } from '@headlessui/react'
import { createContext, useContext, useState } from 'react'

export interface SidePanelItem {
  id: string
  content: React.ReactNode
}

interface SidePanelContextProps {
  panel: SidePanelItem | undefined
  setPanel: (value: SidePanelItem | undefined) => void
}
const SidePanelContext = createContext<SidePanelContextProps>({
  panel: { id: '', content: undefined },
  setPanel: () => undefined,
})

export const useSidePanel = () => {
  const context = useContext(SidePanelContext)

  return context
}
export const SidePanelProvider: React.FunctionComponent<{
  children: React.ReactNode
}> = ({ children }) => {
  const [panel, _setPanel] = useState<SidePanelItem | undefined>()

  const setPanel = (value: SidePanelItem | undefined) => {
    if (value?.id === panel?.id) {
      _setPanel(undefined)
    } else {
      _setPanel(value)
    }
  }

  return (
    <SidePanelContext.Provider value={{ panel, setPanel }}>
      {children}
    </SidePanelContext.Provider>
  )
}

export const SidePanel: React.FunctionComponent = () => {
  const { panel } = useSidePanel()
  return (
    <Transition
      as={'div'}
      enter='transition ease-out duration-200'
      enterFrom='opacity-0 -translate-x-1'
      enterTo='opacity-100 translate-x-0'
      leave='transition ease-in duration-150'
      leaveFrom='opacity-100 translate-x-0'
      leaveTo='opacity-0 -translate-x-1'
      show={panel !== undefined}
      className='h-full'
    >
      <div className='h-full overflow-auto relative z-[1000] bg-white'>
        {panel?.content}
      </div>
    </Transition>
  )
}
