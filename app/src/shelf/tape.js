import { loc, t, other } from '../i18n/index.js'

export const ACCENT = {
  MAIN: 'var(--cobalt)', SEGUE: 'var(--vermilion)', TALE: 'var(--ochre)',
  COMP: 'var(--ink)', SIDE: 'var(--moss)', EXPL: 'var(--moss)', EVNT: 'var(--vermilion)',
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function titleOf(story, lang) {
  if (story.placeholder) return t(lang, 'empty')
  return loc(story.title, lang) || loc(story.title, other(lang)) || story.slug
}

function mediaUrl(m) {
  return m && (typeof m === 'string' ? m : m.url) || null
}

/**
 * Fill both faces of a pooled tape element for a story.
 * Art faces use the uploaded media; otherwise a generated typographic tape (STYLE §6).
 */
export function fillTape(el, story, lang, geo) {
  const sp = el.firstChild
  const cv = el.lastChild
  const { H, ws, d } = geo
  const code = story.placeholder ? '—' : story.category
  const accent = ACCENT[story.category] || 'var(--ink)'
  const title = esc(titleOf(story, lang))
  const chap = esc(story.chapter_label || '')

  const spUrl = mediaUrl(story.spine_media)
  const cvUrl = mediaUrl(story.cover_media)

  if (spUrl) {
    sp.className = 'face sp art'
    sp.style.backgroundImage = `url("${spUrl}")`
    sp.innerHTML = ''
  } else {
    const len = Math.max(4, (titleOf(story, lang) || '').length)
    const cols = len > 22 ? 2 : 1
    const f = Math.max(9, Math.min(ws * (cols === 2 ? 0.34 : 0.46), (H * 0.5) / (Math.ceil(len / cols) * 0.5)))
    sp.className = 'face sp gen'
    sp.style.backgroundImage = ''
    sp.innerHTML =
      `<div class="band" style="background:${accent}">${esc(code)}</div>` +
      `<div class="mid"><div class="vt" lang="${lang}" style="font-size:${f.toFixed(1)}px;height:${(H * 0.5).toFixed(0)}px">${title}</div></div>` +
      (chap ? `<div class="chap lbl">${chap}</div>` : '') +
      `<div class="foot"><span class="b lbl">CRANELLZ</span><span class="vhs">VHS</span></div>`
  }

  if (cvUrl) {
    cv.className = 'face cv art'
    cv.style.backgroundImage = `url("${cvUrl}")`
    cv.innerHTML = ''
  } else {
    cv.className = 'face cv gen'
    cv.style.backgroundImage = ''
    cv.style.setProperty('--accent', accent)
    cv.innerHTML = coverInner(story, lang, d)
  }
}

/** Inner HTML of the generated cover, sized for a cover of width d. Shared with the detail poster. */
export function coverInner(story, lang, d) {
  const code = story.placeholder ? '—' : story.category
  const title = esc(titleOf(story, lang))
  const ver = story.placeholder ? '' : `${t(lang, 'ver')} ${esc(story.version)}`
  const tl = (titleOf(story, lang) || '').length
  const fs = Math.max(14, Math.min(d * 0.15, (d * 0.86) / (Math.max(10, tl) * 0.2)))
  return (
    `<div class="top lbl">A CRANELLZ ARCHIVE</div>` +
    `<div class="title" lang="${lang}" style="font-size:${fs.toFixed(1)}px">${title}</div>` +
    `<div class="duo"><span class="code lbl">${esc(code)}</span></div>` +
    `<div class="row"><span class="lbl">${ver}</span><span class="vhs">VHS</span></div>`
  )
}
