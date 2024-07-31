import { useRef, useEffect } from 'react'

export const useBackgroundLoop = (
  callback: () => void,
  intervalInSeconds: number,
) => {
  const callbackRef = useRef(callback)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Update the callback function if it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Start the background loop when the component mounts
  useEffect(() => {
    const handle = () => {
      callbackRef.current()
    }

    // Call the callback immediately when the component mounts
    handle()

    // Start the interval
    intervalRef.current = setInterval(handle, intervalInSeconds * 1000)

    // Clear the interval when the component unmounts
    return () => {
      clearInterval(intervalRef.current)
    }
  }, [intervalInSeconds])

  // Function to manually stop the background loop
  const stopBackgroundLoop = () => {
    clearInterval(intervalRef.current)
  }

  return stopBackgroundLoop
}
