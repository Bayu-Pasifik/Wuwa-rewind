import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { trapFocus } from '../useFocusTrap.js'
import Logo from '../Logo.jsx'
import { t, tj, loc, other } from '../i18n/index.js'
import { ACCENT, coverInner, titleOf } from '../shelf/tape.js'
import { hasBody } from '../reader/doc.js'

const bodyAvail = (s, l) => (s.has_body_en !== undefined ? !!s[`has_body_${l}`] : hasBody(s.body?.[l]))

const EASE = 'cubic-bezier(.2,.8,.2,1)'
const SHEET_EASE = 'cubic-bezier(.76,0,.18,1)'
const BLOBS = [
  [150, 330, 0], [340, 600, 120], [250, 120, 220], [90, 760, 300],
  [400, 250, 360], [260, 860, 420], [230, 470, 180],
]

export function fmtDate(iso, lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      .format(new Date(iso + 'T00:00:00'))
  } catch { return iso }
}

const Detail = forwardRef(function Detail({ story, lang, settings, categories, onClose, onRead }, ref) {
  const root = useRef(null)
  const release = useRef(null)
  const blobs = useRef([])
  const raf = useRef(0)
  const reduced = useRef(false)
  const stateRef = useRef({ open: false })

  const lines = () => root.current.querySelectorAll('.dl > span, .dl > div')
  const setR = (fn) => blobs.current.forEach((c, i) => c && c.setAttribute('r', fn(i).toFixed(1)))

  const inkLoop = (start) => {
    const step = (now) => {
      const tm = now - start
      setR((i) => 720 * (1 - Math.pow(1 - Math.min(1, Math.max(0, (tm - BLOBS[i][2]) / 1250)), 3)))
      if (tm < 2400) raf.current = requestAnimationFrame(step)
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(step)
  }

  const inset = (r) => `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 3px)`

  useImperativeHandle(ref, () => ({
    el: () => root.current,
    isOpen: () => stateRef.current.open,
    open(rect, instant = false) {
      const el = root.current
      const rm = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      reduced.current = rm
      stateRef.current.open = true
      release.current?.(); release.current = trapFocus(el)
      el.getAnimations().forEach((a) => a.cancel())
      setR(() => 0)
      el.style.visibility = 'visible'
      el.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`
      el.animate(
        [{ clipPath: inset(rect), transform: 'rotate(-4.5deg)' },
         { clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' }],
        { duration: rm ? 1 : 1050, easing: SHEET_EASE, fill: 'both' })
      lines().forEach((l, i) => {
        l.getAnimations().forEach((a) => a.cancel())
        l.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
          { duration: rm ? 1 : 900, delay: rm ? 0 : 620 + i * 75, easing: EASE, fill: 'both' })
      })
      inkLoop(rm ? performance.now() - 5000 : performance.now() + 520)
    },
    close(rect, instant = false) {
      const el = root.current
      const rm = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      stateRef.current.open = false
      release.current?.(); release.current = null
      el.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`
      el.getAnimations().forEach((a) => a.cancel())
      const a = el.animate(
        [{ clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' },
         { clipPath: inset(rect), transform: 'rotate(-4.5deg)' }],
        { duration: rm ? 1 : 850, easing: SHEET_EASE, fill: 'both' })
      a.onfinish = () => {
        if (stateRef.current.open) return
        el.style.visibility = 'hidden'
        el.getAnimations().forEach((x) => x.cancel())
        lines().forEach((l) => l.getAnimations().forEach((x) => x.cancel()))
        cancelAnimationFrame(raf.current)
      }
    },
    /** Hand over to the reader: lines slide up and out, ink shrinks. */
    leaveForReader(instant = false) {
      const rm = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      lines().forEach((l, i) => {
        l.getAnimations().forEach((a) => a.cancel())
        l.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }],
          { duration: rm ? 1 : 600, delay: rm ? 0 : i * 50, easing: EASE, fill: 'both' })
      })
      cancelAnimationFrame(raf.current)
      const from = blobs.current.map((c) => parseFloat(c?.getAttribute('r') || 0))
      const t0 = performance.now()
      const step = (now) => {
        const p = rm ? 1 : Math.min(1, (now - t0) / 700)
        setR((i) => from[i] * (1 - p * p * p))
        if (p < 1) raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
      return new Promise((res) => setTimeout(res, rm ? 0 : 700))
    },
    /** Reader closed: bring the sheet's text and poster back, already in place. */
    restore() {
      lines().forEach((l) => {
        l.getAnimations().forEach((a) => a.cancel())
        l.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(0)' }], { duration: 1, fill: 'both' })
      })
      cancelAnimationFrame(raf.current)
      setR(() => 720)
    },
  }))

  const chars = story?.characters || []
  const shown = chars.slice(0, 6)
  const sub = story ? [loc(story.title, other(lang)), story.original_title].filter(Boolean).join(' / ') : ''
  const cat = categories?.find((c) => c.code === story?.category)
  const catName = (cat && loc(cat.name, lang)) || story?.category
  const meta = story
    ? [catName, `${t(lang, 'ver')} ${story.version}`, story.chapter_label, story.region].filter(Boolean).join(' / ')
    : ''

  let cta = { label: tj(lang, 'writeup_coming'), disabled: true, action: null }
  if (story) {
    if (bodyAvail(story, lang)) cta = { label: tj(lang, 'read'), disabled: false, action: () => onRead(story, lang) }
    else if (bodyAvail(story, other(lang)))
      cta = { label: t(lang, 'read_other'), disabled: false, action: () => onRead(story, other(lang), true) }
  }

  const accent = story ? ACCENT[story.category] || 'var(--ink)' : 'var(--ink)'
  const coverUrl = story && (typeof story.cover_media === 'string' ? story.cover_media : story.cover_media?.url)

  return (
    <div className="detail" ref={root} role="dialog" aria-modal="true" aria-label={story ? titleOf(story, lang) : ''}>
      <button className="lbl box close" onClick={onClose}>{tj(lang, 'close')}</button>
      <div className="dlogo"><Logo settings={settings} lang={lang} /></div>
      {story && (
        <>
          <div className="d-left" lang={lang}>
            <div className="dl"><span className="lbl d-sub">{sub || ' '}</span></div>
            <div className="dl"><span className="d-title">{titleOf(story, lang)}</span></div>
            <div className="dl"><span className="lbl d-meta">{meta}</span></div>
            <div className="dl">
              <div className="chips">
                {shown.map((c) => <span key={c} className="lbl box">{c}</span>)}
                {chars.length > shown.length && <span className="lbl box">+{chars.length - shown.length}</span>}
              </div>
            </div>
            <div className="dl"><span className="d-syn">{loc(story.synopsis, lang) || loc(story.synopsis, other(lang))}</span></div>
            <div className="dl"><span className="d-credit">{t(lang, 'credit').replace('{date}', fmtDate(story.release_date, lang))}</span></div>
            <div className="dl">
              <span>
                <button className="lbl cta" disabled={cta.disabled} onClick={cta.action || undefined}>{cta.label}</button>
              </span>
            </div>
          </div>
          <div className="d-right">
            <svg viewBox="0 0 474 900" aria-hidden="true" className="poster">
              <defs>
                <clipPath id="pc"><rect width="474" height="900" /></clipPath>
                <filter id="ink" filterUnits="userSpaceOnUse" x="-200" y="-200" width="874" height="1300">
                  <feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="3" seed="7" result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale="120" xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <mask id="inkmask" maskUnits="userSpaceOnUse" x="-200" y="-200" width="874" height="1300">
                  <g filter="url(#ink)" fill="#fff">
                    {BLOBS.map(([bx, by], i) => (
                      <circle key={i} cx={bx} cy={by} r="0" ref={(el) => (blobs.current[i] = el)} />
                    ))}
                  </g>
                </mask>
              </defs>
              <g mask="url(#inkmask)">
                <g clipPath="url(#pc)">
                  {coverUrl ? (
                    <image href={coverUrl} x="0" y="0" width="474" height="900" preserveAspectRatio="xMidYMid slice" />
                  ) : (
                    <foreignObject x="0" y="0" width="474" height="900">
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        className="gen cv poster-cv"
                        style={{ '--accent': accent }}
                        dangerouslySetInnerHTML={{ __html: coverInner(story, lang, 474) }}
                      />
                    </foreignObject>
                  )}
                </g>
              </g>
            </svg>
          </div>
        </>
      )}
    </div>
  )
})

export default Detail
