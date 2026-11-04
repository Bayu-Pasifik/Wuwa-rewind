import { fillTape } from './tape.js'
import { captionTexts } from './caption.js'

/**
 * Vertical zig-zag shelf: one real DOM row per story, covers alternate left/right while scrolling down.
 * No rAF loop, no 3D transforms. The browser scrolls; IntersectionObservers decide which row is active
 * and when to reveal / lazily fill a row. Same public API as the old carousel engine.
 */
export function createEngine({ shelf, stage, cursor, reduced, getCategories, onActive, onOpen }) {
  let list = []
  let rows = []
  let lang = 'en'
  const geo = { H: 300, ws: 50, d: 158, v: 0 }
  const S = { active: -1, sel: null, blocked: false, mx: 0, my: 0, cx: 0, cy: 0 }

  const measure = () => {
    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:var(--H);visibility:hidden'
    shelf.appendChild(probe)
    geo.H = probe.getBoundingClientRect().height
    probe.remove()
    geo.d = (geo.H * 474) / 900
    geo.ws = (geo.H * 142) / 840
    geo.v++
    stage.style.setProperty('--d', geo.d + 'px')
    stage.style.setProperty('--ws', geo.ws + 'px')
    rows.forEach((r) => { if (r.seen) fill(r) })
  }

  const fill = (r) => {
    const key = lang + '|' + geo.v
    if (r.key === key) return
    r.key = key
    const st = r.story
    fillTape(r.cv, st, lang, geo)
    const [t1, t2, t3] = captionTexts(st, lang, getCategories())
    r.t1.textContent = t1
    r.t1.lang = lang
    r.t2.textContent = t2
    r.t3.textContent = t3
    r.cv.setAttribute('aria-label', t1)
  }

  // ---------- observers ----------
  const nearIO = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return
      const r = e.target.__row
      r.seen = true
      fill(r)
    })
  }, { root: shelf, rootMargin: '1400px 0px' })

  const revealIO = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add('in')
      revealIO.unobserve(e.target)
    })
  }, { root: shelf, rootMargin: '0px 0px -6% 0px' })

  const activeIO = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) setActive(e.target.__row.i) })
  }, { root: shelf, rootMargin: '-46% 0px -46% 0px' })

  const setActive = (i) => {
    if (i === S.active || !rows[i]) return
    const first = S.active === -1
    const dir = first ? 1 : Math.sign(i - S.active) || 1
    if (rows[S.active]) rows[S.active].cv.tabIndex = -1
    S.active = i
    S.sel = null
    rows[i].cv.tabIndex = 0
    onActive?.(list[i], dir, i, first)
  }

  // ---------- rows ----------
  const open = (r) => {
    if (S.blocked || r.story.placeholder) return
    setActive(r.i)
    S.sel = r.i
    onOpen?.(r.story)
  }

  const build = () => {
    nearIO.disconnect(); revealIO.disconnect(); activeIO.disconnect()
    stage.replaceChildren()
    rows = list.map((story, i) => {
      const el = document.createElement('article')
      el.className = 'zrow ' + (i % 2 ? 'even' : 'odd') + (reduced ? ' in' : '')
      const wrap = document.createElement('div')
      wrap.className = 'zwrap'
      const cv = document.createElement('div')
      cv.className = 'ztape'
      cv.setAttribute('role', 'button')
      cv.tabIndex = -1
      cv.innerHTML = '<div class="face sp" aria-hidden="true"></div><div class="face cv" aria-hidden="true"></div>'
      wrap.append(cv)
      const tx = document.createElement('div')
      tx.className = 'ztxt'
      const t1 = document.createElement('h2'); t1.className = 'zt'
      const t2 = document.createElement('div'); t2.className = 'zs lbl'
      const t3 = document.createElement('div'); t3.className = 'zm'
      tx.append(t1, t2, t3)
      el.append(wrap, tx)
      const r = { el, cv, t1, t2, t3, story, i, key: '', seen: false }
      el.__row = r
      if (!story.placeholder) {
        cv.addEventListener('click', () => open(r))
        tx.addEventListener('click', () => open(r))
        cv.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(r) } })
        cv.addEventListener('pointerenter', () => { if (!S.blocked) cursor.classList.add('open') })
        cv.addEventListener('pointermove', (ev) => {
          if (S.blocked || reduced || ev.pointerType === 'touch') return
          const b = wrap.getBoundingClientRect()
          const px = (ev.clientX - b.left) / b.width - 0.5
          const py = (ev.clientY - b.top) / b.height - 0.5
          cv.style.setProperty('--ry', (px * 26).toFixed(1) + 'deg')
          cv.style.setProperty('--rx', (-py * 16).toFixed(1) + 'deg')
        })
        cv.addEventListener('pointerleave', () => {
          cursor.classList.remove('open')
          cv.style.removeProperty('--ry'); cv.style.removeProperty('--rx')
        })
        tx.addEventListener('pointerenter', () => { if (!S.blocked) cursor.classList.add('open') })
        tx.addEventListener('pointerleave', () => cursor.classList.remove('open'))
      } else {
        el.classList.add('empty')
        cv.removeAttribute('role')
      }
      return r
    })
    stage.append(...rows.map((r) => r.el))
    rows.forEach((r) => { nearIO.observe(r.el); activeIO.observe(r.el); if (!reduced) revealIO.observe(r.el) })
  }

  const setList = (l, start = 0) => {
    list = l
    S.active = -1
    S.sel = null
    build()
    measure()
    jumpTo(start)
  }
  const setLang = (l) => {
    lang = l
    rows.forEach((r) => { r.key = ''; if (r.seen) fill(r) })
  }

  const clamp = (i) => Math.max(0, Math.min(list.length - 1, i))
  const jumpTo = (i) => {
    const r = rows[clamp(i)]
    if (!r) return
    fill(r); r.seen = true
    r.el.scrollIntoView({ block: 'center', behavior: 'instant' })
    setActive(r.i)
    S.sel = r.i
  }
  const goTo = (i) => {
    const r = rows[clamp(i)]
    if (r) r.el.scrollIntoView({ block: 'center', behavior: reduced ? 'instant' : 'smooth' })
  }
  const step = (n) => { if (!S.blocked && list.length > 1) goTo((S.active < 0 ? 0 : S.active) + n) }

  const coverRect = () => {
    const r = rows[S.sel ?? S.active] || rows[0]
    return r.cv.lastChild.getBoundingClientRect()
  }

  // ---------- cursor (rAF only while it is still catching up) ----------
  let raf = 0
  const tick = () => {
    S.cx += (S.mx - S.cx) * 0.3
    S.cy += (S.my - S.cy) * 0.3
    cursor.style.transform = `translate3d(${S.cx}px,${S.cy}px,0)`
    raf = Math.abs(S.mx - S.cx) + Math.abs(S.my - S.cy) > 0.5 ? requestAnimationFrame(tick) : 0
  }
  const onMove = (e) => {
    S.mx = e.clientX; S.my = e.clientY
    if (!raf) raf = requestAnimationFrame(tick)
  }
  const onOver = (e) => {
    const btn = e.target.closest && e.target.closest('button,a')
    cursor.classList.toggle('btn', !!btn && !shelf.contains(btn))
  }
  const onKey = (e) => {
    if (S.blocked || e.target.closest?.('input,textarea')) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); step(1) }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
  }
  addEventListener('pointermove', onMove, { passive: true })
  addEventListener('mouseover', onOver)
  addEventListener('keydown', onKey)
  addEventListener('resize', measure)

  return {
    setList, setLang, goTo, step, jumpTo, coverRect,
    setOpen: (b) => {
      S.blocked = b
      shelf.style.overflowY = b ? 'hidden' : ''
      if (b) cursor.classList.remove('open')
    },
    activeIndex: () => S.active,
    current: () => (list.length ? list[S.sel ?? Math.max(0, S.active)] : null),
    cursorState: (cls, on) => cursor.classList.toggle(cls, on),
    destroy() {
      cancelAnimationFrame(raf)
      nearIO.disconnect(); revealIO.disconnect(); activeIO.disconnect()
      removeEventListener('pointermove', onMove)
      removeEventListener('mouseover', onOver)
      removeEventListener('keydown', onKey)
      removeEventListener('resize', measure)
      stage.replaceChildren()
    },
  }
}
