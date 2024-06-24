import { Transition } from '@headlessui/react'
import { createContext, Fragment, useContext, useState } from 'react'

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
      enter='hw-transition hw-ease-out hw-duration-200'
      enterFrom='hw-opacity-0 -hw-translate-x-1'
      enterTo='hw-opacity-100 hw-translate-x-0'
      leave='hw-transition hw-ease-in hw-duration-150'
      leaveFrom='hw-opacity-100 hw-translate-x-0'
      leaveTo='hw-opacity-0 -hw-translate-x-1'
      show={panel !== undefined}
    >
      <div className='hw-h-full hw-overflow-auto'>{panel?.content}</div>
    </Transition>
  )
}
