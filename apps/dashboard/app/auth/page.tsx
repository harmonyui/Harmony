'use client'

import type { NextPage } from 'next'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const AuthPage: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    window.postMessage({
      isSignedIn: true,
    })
    router.push('/')
  }, [])

  return null
}

export default AuthPage
