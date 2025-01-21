import React from 'react'
import { AuthPage } from './auth'
import { createRoot } from 'react-dom/client'
const authRoot = document.getElementById('auth-root')
if (!authRoot) {
  throw new Error("Can't find auth-root element")
}
const root = createRoot(authRoot)
root.render(
  <React.StrictMode>
    <AuthPage />
  </React.StrictMode>,
)
