import React from 'react'
import Logo from './Logo.jsx'
import { LOCALES, loc, t } from './i18n/index.js'

export default function About({ settings, lang, setLang }) {
  const home = `/?lang=${lang}`
  return (
    <div className="reader about" lang={lang}>
      <header className="r-head">
        <a className="lbl" href={home}>{t(lang, 'back')}</a>
        <a href={home} aria-label="Cranellz"><Logo settings={settings} lang={lang} /></a>
        <span className="langsw lbl" role="group" aria-label={t(lang, 'language')}>
          {LOCALES.map((l) => (
            <button key={l} className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </span>
      </header>
      <main className="r-col">
        <h1 className="d-title">{t(lang, 'about_title')}</h1>
        <div className="r-body">
          <p>{t(lang, 'about_body')}</p>
          <p>{loc(settings?.disclaimer, lang) || t(lang, 'footer')}</p>
        </div>
      </main>
    </div>
  )
}
