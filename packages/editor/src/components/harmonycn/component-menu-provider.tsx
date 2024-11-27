import { createContext, useContext, useState } from 'react'
import type { ComponentMenuOptions } from './add-component-menu'
import { AddComponentMenu } from './add-component-menu'

interface ComponentMenuContextProps {
  isOpen: boolean
  setIsOpen: (value: boolean, opts?: ComponentMenuOptions) => void
}
const ComponentMenuContext = createContext<
  ComponentMenuContextProps | undefined
>(undefined)

export const ComponentMenuProvider: React.FunctionComponent<{
  children: React.ReactNode
}> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ComponentMenuOptions>({
    position: 'above',
  })
  const onOpen = (value: boolean, opts?: ComponentMenuOptions) => {
    opts && setOptions(opts)
    setIsOpen(value)
  }

  return (
    <ComponentMenuContext.Provider value={{ isOpen, setIsOpen: onOpen }}>
      {children}
      <AddComponentMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        options={options}
      />
    </ComponentMenuContext.Provider>
  )
}

export const useComponentMenu = () => {
  const context = useContext(ComponentMenuContext)
  if (!context) {
    throw new Error(
      'useComponentMenu must be used within a ComponentMenuProvider',
    )
  }

  return context
}
