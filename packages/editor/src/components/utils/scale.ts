import { useCallback, useEffect, useState } from 'react'
import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import hotkeys from 'hotkeys-js'
import { useHarmonyStore } from '../../hooks/state'
import { isSelectable } from '../inspector/inspector'
import { getBoundingRect } from '../snapping/calculations'

export const useScale = () => {
  const rootComponent = useHarmonyStore((state) => state.rootComponent)?.element
  const selectedComponent = useHarmonyStore(
    (state) => state.selectedComponent?.element,
  )
  const setSelectedComponent = useHarmonyStore((state) => state.selectElement)

  const [cursorX, setCursorX] = useState(0)
  const [cursorY, setCursorY] = useState(0)
  const [scale, _setScale] = useState(0.8)
  const [oldScale, setOldSclae] = useState(scale)

  const setScale = useCallback(
    (newScale: number, _: { x: number; y: number }) => {
      const scrollContainer = document.getElementById(
        'harmony-scroll-container',
      )

      //Adjust the scroll so that it zooms with the pointer
      if (rootComponent && scrollContainer) {
        const currScrollLeft = scrollContainer.scrollLeft
        const currScrollTop = scrollContainer.scrollTop
        const rootRect = getBoundingRect(rootComponent)

        const offsetX = cursorX - rootRect.left
        const offsetY = cursorY - rootRect.top
        const scaleDelta = newScale - scale
        // const scrollLeft = (offsetX / scale);
        // const scrollTop = (offsetY / scale);

        const ratio = scaleDelta / oldScale

        const newX = currScrollLeft + (offsetX - currScrollLeft) * ratio
        const newY = currScrollTop + (offsetY - currScrollTop) * ratio

        scrollContainer.scrollLeft = newX
        scrollContainer.scrollTop = newY
      }

      if (selectedComponent) {
        if (!isSelectable(selectedComponent, newScale)) {
          setSelectedComponent(undefined)
        }
      }

      _setScale(newScale)
    },
    [rootComponent, oldScale, scale, cursorX, cursorY, selectedComponent],
  )

  const onScaleIn = useEffectEvent((e: KeyboardEvent) => {
    e.preventDefault()
    setScale(Math.min(scale + 0.25, 5), { x: cursorX, y: cursorY })
  })

  const onScaleOut = useEffectEvent((e: KeyboardEvent) => {
    e.preventDefault()
    setScale(Math.min(scale - 0.25, 5), { x: cursorX, y: cursorY })
  })

  const onMouseMove = useEffectEvent((e: MouseEvent) => {
    const scrollContainer = document.getElementById('harmony-scroll-container')
    if (!scrollContainer) return

    const currScrollLeft = scrollContainer.scrollLeft
    const currScrollTop = scrollContainer.scrollTop

    const newValX = e.clientX + currScrollLeft
    const newValY = e.clientY + currScrollTop
    setCursorX(newValX)
    setCursorY(newValY)
    setOldSclae(scale)
  })

  useEffect(() => {
    hotkeys('ctrl+=,command+=', onScaleIn)
    hotkeys('ctrl+-,command+-', onScaleOut)
    document.addEventListener('mousemove', onMouseMove)
  }, [])

  return [scale, setScale]
}
