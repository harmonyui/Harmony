import { useEffectEvent } from '@harmony/ui/src/hooks/effect-event'
import hotkeys, { KeyHandler } from 'hotkeys-js'
import { useEffect } from 'react'

export const useHotKeys = (key: string, keyHandler: KeyHandler) => {
  const handler = useEffectEvent(keyHandler)

  useEffect(() => {
    hotkeys(key, handler)

    return () => {
      hotkeys.unbind(key, handler)
    }
  }, [])
}
