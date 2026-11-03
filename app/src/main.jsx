import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource-variable/inter-tight'
import './styles/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
