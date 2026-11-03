import { useCallback, useEffect, useState } from 'react'
import en from './en.json'
import id from './id.json'

const DICT = { en, id }
export const LOCALES = ['en', 'id']
// Decorative Japanese half of every "PRIMARY / SECONDARY" chrome label. Never changes.
export const JP = {
  back: '戻る', all: 'すべて', close: '閉じる', open: '開く', read: '物語を読む',
  writeup_coming: '準備中', next: '次へ', empty: 'まだありません',
}

export const t = (lang, key) => DICT[lang]?.[key] ?? DICT.en[key] ?? key
// "BACK / 戻る"
export const tj = (lang, key) => (JP[key] ? `${t(lang, key)} / ${JP[key]}` : t(lang, key))
export const loc = (obj, lang) => (obj ? obj[lang] ?? null : null)
export const other = (lang) => (lang === 'en' ? 'id' : 'en')

export function detectLocale(defaultLocale = 'en') {
  try {
    const q = new URLSearchParams(location.search).get('lang')
    if (LOCALES.includes(q)) return q
    if (/^\/id(\/|$)/.test(location.pathname)) return 'id'
    const s = localStorage.getItem('cranellz.lang')
    if (LOCALES.includes(s)) return s
  } catch { /* storage blocked */ }
  if (defaultLocale && defaultLocale !== 'en') return defaultLocale
  const nav = (navigator.language || 'en').toLowerCase()
  if (nav.startsWith('id')) return 'id'
  return defaultLocale || 'en'
}

export function useLocale(defaultLocale) {
  const [lang, setLangState] = useState(() => detectLocale(defaultLocale))
  const setLang = useCallback((l) => {
    if (!LOCALES.includes(l)) return
    setLangState(l)
    try { localStorage.setItem('cranellz.lang', l) } catch { /* ignore */ }
    const u = new URL(location.href)
    u.searchParams.set('lang', l)
    history.replaceState(history.state, '', u)
  }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  return [lang, setLang]
}
