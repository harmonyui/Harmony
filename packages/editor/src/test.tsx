import { useEffect } from 'react'

export const HarmonySetup = () => {
  useEffect(() => {
    console.log('There')
  }, [])
  return <div>Hello there</div>
}
