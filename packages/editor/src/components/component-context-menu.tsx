import {
  DropdownItem,
  DropdownLineItem,
} from '@harmony/ui/src/components/core/dropdown'
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useHarmonyStore } from '../hooks/state'
import {
  ComponentUpdateWithoutGlobal,
  useHarmonyContext,
} from './harmony-context'
import { useOpenEditor } from '../hooks/open-editor'
import { useUpdateComponent } from './harmonycn/update-component'
import { useComponentMenu } from './harmonycn/component-provider'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import { getComponentIdAndChildIndex } from '../utils/element-utils'
import { generateComponentIdFromParent } from '@harmony/util/src/utils/component'
import { WrapUnwrapComponent } from '@harmony/util/src/updates/component'
import { createUpdate } from '@harmony/util/src/updates/utils'

export const ComponentContextMenu: React.FunctionComponent = () => {
  const ref = useRef<HTMLDivElement>(null)
  const selectedComponent = useHarmonyStore((store) => store.selectedComponent)
  const { isToggled } = useHarmonyContext()

  const handleContextMenu = useEffectEvent((e: MouseEvent) => {
    if (!ref.current || !isToggled) return
    e.preventDefault()
    ref.current.style.display = 'block'

    ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
  })

  const handleClose = useEffectEvent((e: MouseEvent) => {
    if (ref.current?.contains(e.target as Node) || !ref.current) return
    e.preventDefault()
    ref.current.style.display = 'none'
  })

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('mousedown', handleClose)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('mousedown', handleClose)
    }
  }, [])

  return createPortal(
    <div
      className='absolute hidden top-0 left-0 z-[10000] min-w-[8rem] overflow-hidden rounded-md border bg-white dark:bg-black p-1 text-popover-foreground shadow-md'
      ref={ref}
    >
      <ul>
        <ElementContextMenu
          selectedElements={
            selectedComponent ? [selectedComponent.element] : []
          }
          LineItem={DropdownLineItem}
        />
      </ul>
    </div>,
    document.getElementById('harmony-container') as HTMLElement,
  )
}

interface ElementContextMenuProps {
  selectedElements: HTMLElement[]
  LineItem: React.FunctionComponent<{ onClick: () => void; children: string }>
}
export const ElementContextMenu = ({
  selectedElements,
  LineItem,
}: ElementContextMenuProps) => {
  const { onAttributesChange } = useHarmonyContext()
  const { openEditor, isActive } = useOpenEditor()
  const selectedComponent = useHarmonyStore((store) => store.selectedComponent)
  const { setIsOpen: setComponentMenuOpen } = useComponentMenu()
  const { deleteComponent } = useUpdateComponent()
  const getNewChildIndex = useHarmonyStore((store) => store.getNewChildIndex)

  const onDelete = useEffectEvent(() => {
    if (selectedComponent) {
      deleteComponent(selectedComponent.element)
    }
  })

  const handleWrapElement = useEffectEvent(() => {
    if (selectedElements.length === 0) return
    const { componentId } = getComponentIdAndChildIndex(selectedElements[0])
    const newComponentId = generateComponentIdFromParent(componentId)
    const newChildIndex = getNewChildIndex(newComponentId)

    const parentElement = selectedElements[0].parentElement!
    const topElements: HTMLElement[] = []
    selectedElements.forEach((el) => {
      if (el.parentElement === parentElement) {
        topElements.push(el)
      }
    })

    const unwrap: WrapUnwrapComponent = {
      action: 'unwrap',
    }

    const wrap: WrapUnwrapComponent = {
      action: 'wrap',
      elements: topElements.map(getComponentIdAndChildIndex),
    }

    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'wrap-unwrap',
      componentId: newComponentId,
      childIndex: newChildIndex,
      oldValue: createUpdate(unwrap),
      value: createUpdate(wrap),
    }
    onAttributesChange([update])
  })

  const handleUnwrapElement = useEffectEvent(() => {
    if (!selectedComponent) return
    const { componentId, childIndex } = getComponentIdAndChildIndex(
      selectedComponent.element,
    )

    const unwrap: WrapUnwrapComponent = {
      action: 'unwrap',
    }

    const inBetweenElements = Array.from(
      selectedComponent.element.children,
    ) as HTMLElement[]

    const wrap: WrapUnwrapComponent = {
      action: 'wrap',
      elements: inBetweenElements.map(getComponentIdAndChildIndex),
    }

    const update: ComponentUpdateWithoutGlobal = {
      type: 'component',
      name: 'wrap-unwrap',
      componentId,
      childIndex,
      oldValue: createUpdate(wrap),
      value: createUpdate(unwrap),
    }
    onAttributesChange([update])
  })

  const hoveredComponent = useHarmonyStore((store) => store.hoveredComponent)

  const isGroup = useMemo(() => {
    if (hoveredComponent) {
      if (hoveredComponent.children.length > 0) {
        return true
      }
    }
    return false
  }, [hoveredComponent])

  const items: DropdownItem<string>[] = [
    {
      id: 'add-above',
      name: (
        <LineItem
          onClick={() => setComponentMenuOpen(true, { position: 'above' })}
        >
          Add Above
        </LineItem>
      ),
    },
    {
      id: 'add-below',
      name: (
        <LineItem
          onClick={() => setComponentMenuOpen(true, { position: 'below' })}
        >
          Add Below
        </LineItem>
      ),
    },
    {
      id: 'delete',
      name: <LineItem onClick={onDelete}>Delete</LineItem>,
    },
    {
      id: 'wrap',
      name: <LineItem onClick={handleWrapElement}>Wrap</LineItem>,
    },
  ]

  if (isGroup) {
    items.push({
      id: 'unwrap',
      name: <LineItem onClick={handleUnwrapElement}>UnWrap</LineItem>,
    })
  }

  if (isActive) {
    items.push({
      id: 'open-in-editor',
      name: <LineItem onClick={openEditor}>Open in Editor</LineItem>,
    })
  }

  return <>{items.map((item) => item.name)}</>
}
