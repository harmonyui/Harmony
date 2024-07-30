import { useHarmonySetup } from 'harmony-ai-editor/src'
import 'harmony-ai-editor/src/global.css'
import { useCallback, useEffect, useState } from 'react'

export const HarmonyChrome: React.FunctionComponent = () => {
  const [show, setShow] = useState(false)

  const onToggleEditor = useCallback(() => {
    setShow(!show)
  }, [show, setShow])

  useEffect(() => {
    window.addEventListener('toggleEditor', onToggleEditor)
    return () => {
      window.removeEventListener('toggleEditor', onToggleEditor)
    }
  }, [onToggleEditor])

  useHarmonySetup(
    { local: true, repositoryId: '', overlay: true, show },
    undefined,
  )

  return <></>
}
