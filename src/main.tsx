import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App'
import { readTheme } from './components/layout/ThemeSwitch'
import { LanguageProvider } from './i18n/LanguageContext'

document.documentElement.dataset.teoTheme = readTheme() ? 'dark' : 'light'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)