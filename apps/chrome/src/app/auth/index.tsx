import ReactDOM from 'react-dom'
import React from 'react'
import { AuthPage } from './auth'

ReactDOM.render(
  <React.StrictMode>
    <AuthPage />
  </React.StrictMode>,
  document.getElementById('auth-root'),
)
