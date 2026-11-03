import React, { lazy, Suspense, useEffect, useState } from 'react'
import { getMeta, getSettings, listStories } from './api/stories.js'
import { useLocale } from './i18n/index.js'
import Shelf from './shelf/Shelf.jsx'
import About from './About.jsx'

const Admin = lazy(() => import('./admin/Admin.jsx'))

function Public() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [lang, setLang] = useLocale(null)

  useEffect(() => {
    Promise.all([listStories(), getMeta(), getSettings()])
      .then(([stories, meta, settings]) => setData({ stories, meta, settings }))
      .catch(setError)
  }, [])

  if (error) return <div className="lbl" style={{ padding: 32 }}>Failed to load: {String(error.message || error)}</div>
  if (!data) return <div id="boot"><span>Cranellz</span><small>STORY ARCHIVE / ARSIP CERITA</small></div>
  if (location.pathname.replace(/\/+$/, '') === '/about') return <About settings={data.settings} lang={lang} setLang={setLang} />
  return <Shelf {...data} lang={lang} setLang={setLang} />
}

export default function App() {
  if (location.pathname.startsWith('/admin'))
    return <Suspense fallback={null}><Admin /></Suspense>
  return <Public />
}
