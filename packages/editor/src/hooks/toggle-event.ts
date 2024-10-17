import { useEffect } from 'react'

export const TOGGLE_EVENT = 'toggleEditor'
export const dispatchToggleEvent = () => {
  window.dispatchEvent(new CustomEvent(TOGGLE_EVENT))
}

export const useToggleEvent = (
  callback: (e: CustomEventInit<string>) => void,
) => {
  useEffect(() => {
    window.addEventListener(TOGGLE_EVENT, callback)
    return () => {
      window.removeEventListener(TOGGLE_EVENT, callback)
    }
  }, [callback])
}
