import React, { useEffect, useState } from 'react'
import { getMeta, getSettings, listStories } from './api/stories.js'
import { useLocale } from './i18n/index.js'
import Shelf from './shelf/Shelf.jsx'

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [lang, setLang] = useLocale(null)

  useEffect(() => {
    Promise.all([listStories(), getMeta(), getSettings()])
      .then(([stories, meta, settings]) => setData({ stories, meta, settings }))
      .catch(setError)
  }, [])

  if (error) return <div className="lbl" style={{ padding: 32 }}>Failed to load: {String(error.message || error)}</div>
  if (!data) return null
  return <Shelf {...data} lang={lang} setLang={setLang} />
}
