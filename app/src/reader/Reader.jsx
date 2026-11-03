import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import Logo from '../Logo.jsx'
import { t, tj, loc, other, LOCALES } from '../i18n/index.js'
import { blocksOf, hasBody, plain } from './doc.js'
import { titleOf } from '../shelf/tape.js'
import { fmtDate } from '../detail/Detail.jsx'

const SHEET_EASE = 'cubic-bezier(.76,0,.18,1)'
const EASE = 'cubic-bezier(.2,.8,.2,1)'

function Inline({ nodes }) {
  return (nodes || []).map((n, i) => {
    if (n.type !== 'text') return <Inline key={i} nodes={n.content} />
    let el = n.text
    ;(n.marks || []).forEach((m) => {
      if (m.type === 'bold') el = <strong>{el}</strong>
      else if (m.type === 'italic') el = <em>{el}</em>
    })
    return <React.Fragment key={i}>{el}</React.Fragment>
  })
}

function Block({ node, part }) {
  switch (node.type) {
    case 'paragraph':
      return <p><Inline nodes={node.content} /></p>
    case 'heading': {
      const H = node.attrs?.level === 3 ? 'h3' : 'h2'
      return (
        <H className="part lbl" data-part>
          {part.label} {part.n}
          <span className="part-title"><Inline nodes={node.content} /></span>
        </H>
      )
    }
    case 'blockquote':
      return <blockquote><Inline nodes={(node.content || []).flatMap((c) => c.content || [])} /></blockquote>
    case 'horizontalRule':
    case 'rule':
      return <hr />
    case 'image':
      return (
        <figure>
          <img src={node.attrs?.src} alt={node.attrs?.alt || ''} loading="lazy" />
          {node.attrs?.caption && <figcaption>{node.attrs.caption}</figcaption>}
        </figure>
      )
    case 'dialogue':
      return (
        <div className="dlg">
          <div className="who lbl">{node.attrs?.speaker}</div>
          <div className="line"><Inline nodes={node.content?.length ? node.content : [{ type: 'text', text: node.attrs?.line || '' }]} /></div>
        </div>
      )
    case 'choice': {
      const opts = node.attrs?.options || (node.content || []).map(plain)
      return (
        <div className="choice">
          {opts.map((o, i) => <span key={i} className="box">{o}</span>)}
        </div>
      )
    }
    default:
      return null
  }
}

const Reader = forwardRef(function Reader({ story, lang, settings, stories, categories, onBack, onNav, setLang }, ref) {
  const root = useRef(null)
  const progress = useRef(null)
  const anchor = useRef(null)
  const openRef = useRef(false)

  const doc = story?.body?.[lang]
  const blocks = useMemo(() => blocksOf(doc), [doc])
  const empty = !hasBody(doc)

  let partN = 0
  const parts = blocks.map((b) => (b.type === 'heading' ? ++partN : 0))

  useImperativeHandle(ref, () => ({
    isOpen: () => openRef.current,
    open(instant = false) {
      const el = root.current
      const rm = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      openRef.current = true
      el.scrollTop = 0
      el.getAnimations().forEach((a) => a.cancel())
      el.style.visibility = 'visible'
      el.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }],
        { duration: rm ? 1 : 650, easing: SHEET_EASE, fill: 'both' })
    },
    close(instant = false) {
      const el = root.current
      const rm = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      openRef.current = false
      const a = el.animate([{ clipPath: 'inset(0% 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }],
        { duration: rm ? 1 : 550, easing: SHEET_EASE, fill: 'both' })
      a.onfinish = () => {
        if (openRef.current) return
        el.style.visibility = 'hidden'
        el.getAnimations().forEach((x) => x.cancel())
      }
    },
  }))

  // paragraph reveal on viewport entry (mask slide, once)
  useEffect(() => {
    const el = root.current
    if (!el || !story) return
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targets = el.querySelectorAll('.blk > *')
    if (rm) return
    targets.forEach((x) => { x.style.transform = 'translateY(110%)' })
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        const x = e.target.firstElementChild
        x.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
          { duration: 700, easing: EASE, fill: 'both' })
        io.unobserve(e.target)
      })
    }, { root: el, threshold: 0.05 })
    el.querySelectorAll('.blk').forEach((b) => io.observe(b))
    return () => io.disconnect()
  }, [story, lang, doc])

  // keep position when language switches (match by block index)
  const capture = () => {
    const el = root.current
    const head = 64
    const nodes = [...el.querySelectorAll('.blk')]
    let i = nodes.findIndex((n) => n.getBoundingClientRect().bottom > head + 4)
    if (i < 0) i = nodes.length - 1
    const off = nodes[i] ? nodes[i].getBoundingClientRect().top - head : 0
    anchor.current = { i, off }
  }
  useLayoutEffect(() => {
    const a = anchor.current
    if (!a || !root.current) return
    anchor.current = null
    const nodes = root.current.querySelectorAll('.blk')
    const n = nodes[Math.min(a.i, nodes.length - 1)]
    if (n) root.current.scrollTop += n.getBoundingClientRect().top - 64 - a.off
  }, [lang])

  // story change: back to top
  useEffect(() => { if (root.current && openRef.current) root.current.scrollTop = 0 }, [story?.slug])

  const onScroll = () => {
    const el = root.current
    const max = el.scrollHeight - el.clientHeight
    if (progress.current) progress.current.textContent = `${t(lang, 'progress')} ${max > 0 ? Math.round((el.scrollTop / max) * 100) : 0}%`
  }

  const switchLang = (l) => { if (l === lang) return; capture(); setLang(l) }

  const idx = story ? stories.findIndex((s) => s.slug === story.slug) : -1
  const prev = idx > 0 ? stories[idx - 1] : null
  const next = idx >= 0 && idx < stories.length - 1 ? stories[idx + 1] : null
  const cat = categories?.find((c) => c.code === story?.category)
  const catName = (cat && loc(cat.name, lang)) || story?.category

  return (
    <div className="reader" ref={root} onScroll={onScroll} role="document" lang={lang}>
      <div className="r-head">
        <button className="lbl box" onClick={onBack}>{tj(lang, 'back')}</button>
        <Logo settings={settings} lang={lang} />
        <div>
          <span className="lbl" ref={progress}>{t(lang, 'progress')} 0%</span>
          <span className="langsw lbl" role="group" aria-label={t(lang, 'language')}>
            {LOCALES.map((l) => (
              <button key={l} className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => switchLang(l)}>{l.toUpperCase()}</button>
            ))}
          </span>
        </div>
      </div>
      {story && (
        <div className="r-col">
          <div className="r-kicker lbl">{loc(story.title, other(lang)) || ''}</div>
          <h1 className="r-title">{titleOf(story, lang)}</h1>
          <div className="r-meta lbl">
            {[catName, `${t(lang, 'ver')} ${story.version}`, story.chapter_label, fmtDate(story.release_date, lang)].filter(Boolean).join(' / ')}
          </div>
          <div className="r-body">
            {empty ? (
              <p className="r-nobody">{t(lang, 'no_body')}</p>
            ) : (
              blocks.map((b, i) => (
                <div className="blk" key={i} data-i={i}>
                  <div><Block node={b} part={{ label: t(lang, 'part'), n: parts[i] }} /></div>
                </div>
              ))
            )}
          </div>
          {!empty && <div className="r-fin lbl">{t(lang, 'end_of_story')}</div>}
          <div className="r-end">
            <button disabled={!prev} onClick={() => prev && onNav(prev.slug)} aria-label={t(lang, 'prev_label')}>
              <span className="lbl">← {t(lang, 'prev_story')}</span>
              <span className="nm">{prev ? titleOf(prev, lang) : ''}</span>
            </button>
            <button className="nx" disabled={!next} onClick={() => next && onNav(next.slug)} aria-label={t(lang, 'next_label')}>
              <span className="lbl">{t(lang, 'next_story')} →</span>
              <span className="nm">{next ? titleOf(next, lang) : ''}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default Reader
