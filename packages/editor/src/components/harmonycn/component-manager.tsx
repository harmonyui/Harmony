/* eslint-disable import/no-cycle -- ok*/
import { createPortal } from 'react-dom'
import { Button } from '@harmony/ui/src/components/core/button'
import { PlusIcon } from '@harmony/ui/src/components/core/icons'
import { useHarmonyStore } from '../../hooks/state'
import type { CreatedComponent } from '../../utils/harmonycn/types'
import { useComponentMenu } from './component-provider'

export const ComponentManager: React.FunctionComponent = () => {
  const createdElements = useHarmonyStore((store) => store.createdElements)

  return createdElements.map((data) => {
    if (data.type === 'frame') {
      return <FrameComponent component={data} />
    }

    return null
  })
}

const FrameComponent: React.FunctionComponent<{
  component: CreatedComponent
}> = ({ component }) => {
  const { setIsOpen } = useComponentMenu()
  const selectElement = useHarmonyStore((store) => store.selectElement)

  const onAddClick = () => {
    setIsOpen(true, { parent: component.element })
    selectElement(component.element)
  }

  if (!component.options?.isEmpty) {
    return null
  }

  return createPortal(
    <div
      className='hw-border hw-border-dashed hw-p-2 flex'
      data-non-selectable='true'
    >
      <Button
        mode='none'
        className='hw-rounded-full hw-bg-primary'
        onClick={onAddClick}
      >
        <PlusIcon className='hw-h-4 hw-w-4 hw-text-white' />
      </Button>
    </div>,
    component.element,
  )
}
