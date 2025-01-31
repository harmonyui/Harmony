/* eslint-disable import/no-cycle -- ok*/
import { createPortal } from 'react-dom'
import { Button } from '@harmony/ui/src/components/core/button'
import { PlusIcon } from '@harmony/ui/src/components/core/icons'
import React, { useMemo } from 'react'
import type { CreatedComponent } from '../../utils/harmonycn/types'
import { useHarmonyStore } from '../../hooks/state'
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
  const updateCounter = useHarmonyStore((store) => store.updateCounter)

  const onAddClick = () => {
    setIsOpen(true, { parent: component.element })
    selectElement(component.element)
  }

  const isEmpty = useMemo(() => {
    if (component.element.querySelector('[data-harmony-id]')) return true
  }, [component.element, updateCounter])

  if (isEmpty) {
    return true
  }

  return createPortal(
    <div className='border border-dashed p-2 flex'>
      <Button
        mode='none'
        className='rounded-full bg-primary'
        onClick={onAddClick}
        data-non-selectable='true'
      >
        <PlusIcon className='h-4 w-4 text-white' />
      </Button>
    </div>,
    component.element,
  )
}
