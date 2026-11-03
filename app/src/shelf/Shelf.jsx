import React, { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Logo from '../Logo.jsx'
import Detail from '../detail/Detail.jsx'
import Reader from '../reader/Reader.jsx'
import { LOCALES, t, tj, loc, JP } from '../i18n/index.js'
import { createEngine } from './shelfEngine.js'
import { captionTexts, swapCaption } from './caption.js'
import { titleOf } from './tape.js'
import { setSeo } from '../seo.js'

const PLACEHOLDER = { placeholder: true, slug: '', title: { en: 'NOTHING HERE YET', id: 'BELUM ADA' }, version: '', category: '' }
const ROUTE = /^(?:\/id)?\/story\/([^/]+)(\/read)?\/?$/

const parseRoute = () => {
  const m = location.pathname.match(ROUTE)
  return m ? { slug: decodeURIComponent(m[1]), reading: !!m[2] } : { slug: null, reading: false }
}

export default function Shelf({ stories, meta, settings, lang, setLang }) {
  const [category, setCategory] = useState('')
  const [group, setGroup] = useState('')
  const [detailStory, setDetailStory] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const shelfRef = useRef(null)
  const stageRef = useRef(null)
  const cursorRef = useRef(null)
  const playRef = useRef(null)
  const capRefs = useRef([null, null, null])
  const tabsRef = useRef(null)
  const indRef = useRef(null)
  const detailRef = useRef(null)
  const readerRef = useRef(null)
  const engine = useRef(null)
  const api = useRef({})

  // latest values for the long-lived engine callbacks
  const R = useRef({})
  R.current = { stories, meta, settings, lang, category, detailStory }
  const listRef = useRef([PLACEHOLDER])
  const flags = useRef({ detailOpen: false, reading: false })

  const list = useMemo(() => {
    const l = category ? stories.filter((s) => s.category === category) : stories
    return l.length ? l : [PLACEHOLDER]
  }, [stories, category])

  // categories that actually have published stories
  const cats = useMemo(
    () => (meta.categories || []).filter((c) => stories.some((s) => s.category === c.code)).sort((a, b) => a.sort - b.sort),
    [meta, stories])

  // version groups present in the current list
  const groups = useMemo(() => {
    const present = new Set(list.map((s) => s.version_group).filter(Boolean))
    const all = (meta.versionGroups || []).filter((g) => present.has(g.label)).sort((a, b) => a.sort - b.sort).map((g) => g.label)
    return all.length > 7 ? ['EARLIER', ...all.slice(-6)] : all
  }, [list, meta])
  const tabs = ['ALL', ...groups]
  const activeTab = groups.includes(group) ? group : groups.length && group ? 'EARLIER' : ''

  useEffect(() => {
    const el = tabsRef.current
    const ind = indRef.current
    if (!el || !ind) return
    const i = tabs.indexOf(activeTab)
    const b = el.querySelectorAll('button')[i]
    if (!b) { ind.style.width = '0px'; return }
    ind.style.width = b.offsetWidth + 'px'
    ind.style.transform = `translateX(${b.offsetLeft}px)`
  }, [activeTab, lang, groups.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------- engine + routing ----------------
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let urlTimer = 0
    let lastGroup = ''

    const qs = (extra = {}) => {
      const p = new URLSearchParams(location.search)
      p.delete('story')
      Object.entries(extra).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
      const s = p.toString()
      return s ? '?' + s : ''
    }
    const pushPath = (path) => history.pushState({ app: true }, '', path + qs())

    const listFor = (cat) => {
      const l = cat ? R.current.stories.filter((s) => s.category === cat) : R.current.stories
      return l.length ? l : [PLACEHOLDER]
    }
    const changeCategory = (cat, startSlug) => {
      const l = listFor(cat)
      listRef.current = l
      const i = Math.max(0, l.findIndex((s) => s.slug === startSlug))
      engine.current.setList(l, i)
      setCategory(cat)
      const p = new URLSearchParams(location.search)
      if (cat) p.set('category', cat); else p.delete('category')
      const s = p.toString()
      history.replaceState(history.state, '', location.pathname + (s ? '?' + s : ''))
    }
    const ensureShelfOn = (st) => {
      const i = listRef.current.findIndex((s) => s.slug === st.slug)
      if (i < 0) changeCategory('', st.slug)
      else engine.current.jumpTo(i)
    }

    const onActive = (story, dir, i, first) => {
      const { lang: lg, meta: mt } = R.current
      swapCaption(capRefs.current, captionTexts(story, lg, mt.categories), dir, reduced, lg)
      setGroup(story.version_group || '')
      lastGroup = story.version_group
      setSeo(story, lg, story.placeholder ? 'Cranellz' : `${titleOf(story, lg)} — Cranellz`, story.synopsis?.[lg])
      if (!flags.current.detailOpen) {
        clearTimeout(urlTimer)
        urlTimer = setTimeout(() => {
          if (flags.current.detailOpen) return
          const p = new URLSearchParams(location.search)
          if (story.slug) p.set('story', story.slug); else p.delete('story')
          history.replaceState(history.state, '', location.pathname + '?' + p.toString())
        }, 400)
      }
    }

    // ----- detail -----
    const openDetail = (story, { instant = false, push = true } = {}) => {
      if (!story || story.placeholder || flags.current.detailOpen) return
      flushSync(() => setDetailStory(story))
      flags.current.detailOpen = true
      engine.current.setOpen(true)
      engine.current.cursorState('open', false)
      engine.current.cursorState('spine', false)
      detailRef.current.open(engine.current.coverRect(), instant)
      if (push) pushPath(`/story/${encodeURIComponent(story.slug)}`)
    }
    const closeDetailNow = () => {
      if (!flags.current.detailOpen) return
      flags.current.detailOpen = false
      engine.current.setOpen(false)
      detailRef.current.close(engine.current.coverRect())
    }
    const enterReader = ({ instant = false, push = true } = {}) => {
      if (flags.current.reading) return
      flags.current.reading = true
      const st = R.current.detailStory
      if (push && st) pushPath(`/story/${encodeURIComponent(st.slug)}/read`)
      const go = () => { if (flags.current.reading) readerRef.current.open(instant) }
      if (instant) { detailRef.current.leaveForReader(true); go() }
      else detailRef.current.leaveForReader(false).then(go)
    }
    const exitReaderNow = () => {
      if (!flags.current.reading) return
      flags.current.reading = false
      readerRef.current.close()
      detailRef.current.restore()
    }

    const applyRoute = (instant) => {
      const { slug, reading } = parseRoute()
      const st = slug && R.current.stories.find((s) => s.slug === slug)
      if (!st) {
        exitReaderNow()
        closeDetailNow()
        return
      }
      const cur = R.current.detailStory
      if (!flags.current.detailOpen) {
        ensureShelfOn(st)
        openDetail(st, { instant, push: false })
      } else if (!cur || cur.slug !== st.slug) {
        flushSync(() => setDetailStory(st))
        ensureShelfOn(st)
        detailRef.current.restore()
      }
      if (reading) enterReader({ instant: instant || !flags.current.detailOpen, push: false })
      else exitReaderNow()
    }

    const backUI = () => {
      if (history.state?.app) history.back()
      else {
        const { slug, reading } = parseRoute()
        history.replaceState(null, '', (reading ? `/story/${slug}` : '/') + qs())
        applyRoute(false)
      }
    }

    api.current = {
      openDetail: () => openDetail(engine.current.current()),
      closeUI: backUI,
      readerBackUI: backUI,
      read: (story, lg, switchLang) => { if (switchLang) setLang(lg); enterReader() },
      navStory: (slug) => {
        const st = R.current.stories.find((s) => s.slug === slug)
        if (!st) return
        flushSync(() => setDetailStory(st))
        ensureShelfOn(st)
        pushPath(`/story/${encodeURIComponent(slug)}/read`)
        readerRef.current.el?.scrollTo?.(0, 0)
      },
      goTab: (label) => {
        const l = listRef.current
        if (label === 'ALL') return engine.current.goTo(0)
        const i = label === 'EARLIER' ? 0 : l.findIndex((s) => s.version_group === label)
        if (i >= 0) engine.current.goTo(i)
      },
      setCategory: (cat) => { setMenuOpen(false); changeCategory(cat, null) },
    }

    engine.current = createEngine({
      shelf: shelfRef.current, stage: stageRef.current, cursor: cursorRef.current, play: playRef.current,
      reduced, onActive, onOpen: (story) => openDetail(story),
    })
    engine.current.setLang(R.current.lang)

    // initial state from URL
    const { slug } = parseRoute()
    const p = new URLSearchParams(location.search)
    const wantCat = (R.current.meta.categories || []).some((c) => c.code === p.get('category')) ? p.get('category') : ''
    const startSlug = slug || p.get('story') || R.current.settings?.default_story_slug
    const inCat = R.current.stories.some((s) => s.slug === startSlug && (!wantCat || s.category === wantCat))
    changeCategory(inCat || !startSlug ? wantCat : '', startSlug)
    if (slug) setTimeout(() => applyRoute(true), 0)

    const onPop = () => applyRoute(false)
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (flags.current.reading || flags.current.detailOpen) backUI()
        setMenuOpen(false)
      } else if (e.key === 'Enter' && document.activeElement === document.body && !flags.current.detailOpen) {
        openDetail(engine.current.current())
      }
    }
    addEventListener('popstate', onPop)
    addEventListener('keydown', onKey)
    return () => {
      clearTimeout(urlTimer)
      removeEventListener('popstate', onPop)
      removeEventListener('keydown', onKey)
      engine.current.destroy()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // language switch: rebuild tape text, caption swaps with dir +1, shelf does not move
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const e = engine.current
    if (!e) return
    e.setLang(lang)
    const cur = e.current()
    if (cur) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      swapCaption(capRefs.current, captionTexts(cur, lang, meta.categories), 1, reduced, lang)
      setSeo(cur, lang, cur.placeholder ? 'Cranellz' : `${titleOf(cur, lang)} — Cranellz`, cur.synopsis?.[lang])
    }
  }, [lang, meta])

  // close category menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const f = (e) => { if (!e.target.closest('.menu-wrap')) setMenuOpen(false) }
    addEventListener('pointerdown', f)
    return () => removeEventListener('pointerdown', f)
  }, [menuOpen])

  const catLabel = category
    ? loc(cats.find((c) => c.code === category)?.name, lang) || category
    : t(lang, 'all_stories')
  const social = settings?.social_links || []

  return (
    <>
      <div className="grain" />

      <header className="bar">
        {settings?.back_link_url ? (
          <a className="lbl box" href={settings.back_link_url}>{tj(lang, 'back')}</a>
        ) : <span />}
        <Logo settings={settings} lang={lang} />
        <div className="right-tools">
          <span className="langsw lbl" role="group" aria-label={t(lang, 'language')}>
            {LOCALES.map((l) => (
              <button key={l} className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </span>
          <span className="menu-wrap">
            <button className="lbl box menu-btn" aria-haspopup="listbox" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <span className="txt-l">{catLabel}</span> ▾
            </button>
            <div className={'menu lbl' + (menuOpen ? ' open' : '')} role="listbox" aria-hidden={!menuOpen}>
              <button tabIndex={menuOpen ? 0 : -1} className={!category ? 'on' : ''} onClick={() => api.current.setCategory('')}>{t(lang, 'all_stories')}</button>
              {cats.map((c) => (
                <button key={c.code} tabIndex={menuOpen ? 0 : -1} className={category === c.code ? 'on' : ''} onClick={() => api.current.setCategory(c.code)}>
                  {loc(c.name, lang)} · {c.name_jp}
                </button>
              ))}
            </div>
          </span>
        </div>
      </header>

      <nav className="tabs lbl" aria-label={t(lang, 'versions')} ref={tabsRef}>
        <span className="ind" ref={indRef} />
        {tabs.map((label) => (
          <button key={label} className={label === activeTab ? 'on' : ''} onClick={() => api.current.goTab(label)}>
            {label === 'ALL' ? tj(lang, 'all') : label === 'EARLIER' ? t(lang, 'earlier') : label}
          </button>
        ))}
      </nav>

      <section className="shelf" aria-label={t(lang, 'shelf')} ref={shelfRef}>
        <div className="stage" ref={stageRef} />
      </section>

      <button className="play" ref={playRef} aria-label={t(lang, 'open_label')} onClick={() => api.current.openDetail()}>
        <i />
      </button>

      <div className="caption" aria-live="polite">
        <div className="mask m-title" ref={(el) => (capRefs.current[0] = el)} />
        <div className="mask lbl m-sub" ref={(el) => (capRefs.current[1] = el)} />
        <div className="mask m-meta" ref={(el) => (capRefs.current[2] = el)} />
      </div>

      <button className="arrow l" aria-label={t(lang, 'prev_label')} onClick={() => engine.current?.step(-1)}>
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M5 1 L1 5 L5 9 M1 5 H17" /></svg>
      </button>
      <button className="arrow r" aria-label={t(lang, 'next_label')} onClick={() => engine.current?.step(1)}>
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M13 1 L17 5 L13 9 M17 5 H1" /></svg>
      </button>

      <footer className="foot-bar lbl">
        <span className="disc">
          <button className="lbl" aria-label={t(lang, 'disclaimer_label')}>{t(lang, 'footer')}</button>
          <span className="tip" role="tooltip">{loc(settings?.disclaimer, lang)}</span>
        </span>
        <span>
          <a href={`/about?lang=${lang}`}>{t(lang, 'about')}</a>{social.length > 0 && ' / '}
          {social.map((s, i) => (
            <React.Fragment key={s.url || i}>
              {i > 0 && ' / '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
            </React.Fragment>
          ))}
        </span>
      </footer>

      <div className="cursor" ref={cursorRef}>
        <div className="ring" />
        <div className="dot" />
        <div className="txt"><span>{t(lang, 'open')}<br />{JP.open}</span></div>
      </div>

      <Detail
        ref={detailRef}
        story={detailStory}
        lang={lang}
        settings={settings}
        categories={meta.categories}
        onClose={() => api.current.closeUI()}
        onRead={(s, l, sw) => api.current.read(s, l, sw)}
      />
      <Reader
        ref={readerRef}
        story={detailStory}
        lang={lang}
        settings={settings}
        stories={stories}
        categories={meta.categories}
        setLang={setLang}
        onBack={() => api.current.readerBackUI()}
        onNav={(slug) => api.current.navStory(slug)}
      />
    </>
  )
}
