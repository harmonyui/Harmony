'use client'

import type { NextPage } from 'next'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const AuthPage: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    //Wait for the content script to load
    setTimeout(() => {
      window.postMessage({
        isSignedIn: true,
      })
      router.push('/')
    }, 1000)
  }, [])

  return null
}

export default AuthPage
