'use client'

import type { NextPage } from 'next'
import { useEffect } from 'react'

const AuthPage: NextPage = () => {
  useEffect(() => {
    window.postMessage({
      isSignedIn: true,
    })
    window.close()
  }, [])

  return null
}

export default AuthPage
