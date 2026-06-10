import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n/config' // Initialize i18n before mounting
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
