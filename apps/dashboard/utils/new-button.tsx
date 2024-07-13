'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'
import { setCookie } from './server-actions'

export const NewButton = () => {
  useEffect(() => {
    async function initialize() {
      await setCookie('harmony-user-id', 'none')
      redirect('/')
    }
    void initialize()
  }, [])

  return <></>
}
