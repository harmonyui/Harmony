import { HarmonySetup } from 'harmony-ai-editor/src'
import 'harmony-ai-editor/src/global.css'
import { useCallback, useEffect } from 'react'

export const HarmonyChrome: React.FunctionComponent = () => {
  const onToggleEditor = useCallback(() => {
    console.log('Toggled!')
  }, [])

  useEffect(() => {
    window.addEventListener('toggleEditor', onToggleEditor)
    return () => {
      window.removeEventListener('toggleEditor', onToggleEditor)
    }
  }, [onToggleEditor])
  return <HarmonySetup repositoryId='' local />
}
