 /* eslint-disable import/no-cycle -- ok*/
import { createContext, useContext, useState } from 'react'
import { AddComponentMenu } from './add-component-menu'
import { ComponentManager } from './component-manager'
import type { UpdateComponentOptions } from './update-component'

interface ComponentContextProps {
  isOpen: boolean
  setIsOpen: (value: boolean, opts?: UpdateComponentOptions) => void
}
const ComponentContext = createContext<ComponentContextProps | undefined>(
  undefined,
)

export const ComponentProvider: React.FunctionComponent<{
  children: React.ReactNode
}> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<UpdateComponentOptions>({
    position: 'above',
  })
  const onOpen = (value: boolean, opts?: UpdateComponentOptions) => {
    opts && setOptions(opts)
    setIsOpen(value)
  }

  return (
    <ComponentContext.Provider value={{ isOpen, setIsOpen: onOpen }}>
      {children}
      <ComponentManager />
      <AddComponentMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        options={options}
      />
    </ComponentContext.Provider>
  )
}

const useComponent = () => {
  const context = useContext(ComponentContext)
  if (!context) {
    throw new Error(
      'useComponentMenu must be used within a ComponentMenuProvider',
    )
  }

  return context
}

export const useComponentMenu = () => {
  const { isOpen, setIsOpen } = useComponent()

  return {
    isOpen,
    setIsOpen,
  }
}
