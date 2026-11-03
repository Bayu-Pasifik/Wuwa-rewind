import { fillTape } from './tape.js'

const POOL = 40
const smooth = (x) => x * x * (3 - 2 * x)
const mod = (a, n) => ((a % n) + n) % n

/**
 * Pure-JS shelf engine: one rAF loop, no React state per frame.
 * A fixed pool of 40 tape elements is re-bound each frame to virtual indices around the scroll position.
 */
export function createEngine({ shelf, stage, cursor, play, reduced, onActive, onOpen }) {
  const pool = []
  for (let k = 0; k < POOL; k++) {
    const el = document.createElement('div')
    el.className = 'tape'
    el.setAttribute('role', 'button')
    el.tabIndex = -1
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click() }
    })
    el.innerHTML = '<div class="face sp" aria-hidden="true"></div><div class="face cv" aria-hidden="true"></div>'
    el.__v = null; el.__lift = 0; el.__hover = false; el.__key = ''
    el.addEventListener('pointerenter', () => { el.__hover = true })
    el.addEventListener('pointerleave', () => { el.__hover = false })
    el.addEventListener('click', () => {
      if (S.moved || S.blocked || el.__v == null) return
      const r = el.__v - S.s
      if (Math.abs(r) < 0.5) onOpen?.(list[mod(el.__v, N)])
      else if (N > 1) S.T = el.__v
    })
    stage.appendChild(el)
    pool.push(el)
  }

  let list = []
  let N = 0
  let lang = 'en'
  let W = innerWidth, VH = innerHeight
  const geo = { H: 400, ws: 0, d: 0, gap: 0, v: 0 }

  const S = {
    s: 0, T: 0, active: -1, mx: W / 2, my: VH / 2, cx: W / 2, cy: VH / 2,
    tiltX: 0, tiltY: 0, onCover: false, blocked: false,
    dragging: false, drag: null, moved: false, wheelTimer: 0,
  }

  const measure = () => {
    W = innerWidth; VH = innerHeight
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:var(--H);visibility:hidden'
    document.body.appendChild(probe)
    geo.H = probe.getBoundingClientRect().height
    probe.remove()
    geo.ws = (geo.H * 142) / 840
    geo.d = (geo.H * 474) / 900
    geo.gap = geo.H * 0.03
    geo.v++
    stage.style.setProperty('--ws', geo.ws + 'px')
    stage.style.setProperty('--d', geo.d + 'px')
    play.style.left = W / 2 - 0.5 * geo.d - 6 + 'px'
    play.style.top = VH / 2 + 0.36 * geo.H + 'px'
  }
  measure()

  const setList = (l, start = 0) => {
    list = l
    N = l.length
    S.s = S.T = N ? mod(start, N) : 0
    S.active = -1
    pool.forEach((el) => { el.__v = null; el.__key = '' })
  }
  const setLang = (l) => { lang = l; pool.forEach((el) => { el.__key = '' }) }

  const goTo = (i) => {
    if (N <= 1) return
    const cur = Math.round(S.T)
    const half = Math.floor(N / 2)
    S.T = cur + (mod(i - cur + half, N) - half)
  }
  const step = (n) => { if (N > 1 && !S.blocked) S.T = Math.round(S.T) + n }
  const jumpTo = (i) => { S.s = S.T = N ? mod(i, N) : 0 }

  const coverRect = () => {
    const v = Math.round(S.T)
    const el = pool.find((e) => e.__v === v) || pool[0]
    return el.lastChild.getBoundingClientRect()
  }

  let last = performance.now(), raf = 0
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const { H, ws, d, gap } = geo

    if (N <= 1) { S.s = S.T = 0 }
    else if (reduced) S.s = S.T
    else {
      const k = S.dragging ? 18 : 5.2
      S.s += (S.T - S.s) * (1 - Math.exp(-k * dt))
      if (Math.abs(S.T - S.s) < 1e-4) S.s = S.T
    }
    // keep numbers small: shift by whole loops of N
    if (N > 0 && Math.abs(S.s) > N * 6) {
      const sh = Math.trunc(S.s / N) * N
      S.s -= sh; S.T -= sh
      pool.forEach((e) => { if (e.__v != null) e.__v -= sh })
    }

    const ai = N ? mod(Math.round(S.s), N) : 0
    if (N && ai !== S.active) {
      const first = S.active === -1
      const dir = first ? 1 : Math.sign(S.T - S.s) || 1
      S.active = ai
      onActive?.(list[ai], dir, ai, first)
    }

    // cursor + tilt
    const k16 = 1 - Math.exp(-16 * dt)
    S.cx += (S.mx - S.cx) * k16
    S.cy += (S.my - S.cy) * k16
    cursor.style.transform = `translate3d(${S.cx}px,${S.cy}px,0)`
    const cy0 = VH / 2
    S.onCover = !S.blocked && N > 0 && !list[ai]?.placeholder &&
      Math.abs(S.mx - W / 2) < 0.55 * d && Math.abs(S.my - cy0) < 0.55 * H && Math.abs(S.T - S.s) < 0.3
    const tkY = S.onCover ? ((S.mx - W / 2) / (0.55 * d)) * 9 : ((S.mx - W / 2) / W) * 5
    const tkX = S.onCover ? (-(S.my - cy0) / (H / 2)) * 6 : 0
    const tk = reduced ? 1 : 1 - Math.exp(-7 * dt)
    S.tiltY += (tkY - S.tiltY) * tk
    S.tiltX += (tkX - S.tiltX) * tk
    cursor.classList.toggle('open', S.onCover)
    let overSpine = false

    const lk = reduced ? 1 : 1 - Math.exp(-12 * dt)
    const base = Math.floor(S.s) - POOL / 2
    for (let k = 0; k < POOL; k++) {
      const el = pool[k]
      // slot k always carries virtual indices congruent to k (mod POOL)
      const v = base + mod(k - base, POOL)
      if (N === 0 || (N === 1 && v !== 0)) { el.style.visibility = 'hidden'; el.__v = null; continue }
      const r = v - S.s
      const x0 = r * (ws + gap)
      if (Math.abs(x0) > W / 2 + 2.5 * d) { el.style.visibility = 'hidden'; el.__v = v; continue }
      const key = (N ? mod(v, N) : 0) + '|' + lang + '|' + geo.v
      if (el.__v !== v) { el.__lift = 0 }
      el.__v = v
      if (el.__key !== key) {
        el.__key = key
        fillTape(el, list[mod(v, N)], lang, geo)
        el.setAttribute('aria-label', list[mod(v, N)]?.title?.[lang] || '')
      }
      const B = Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5
      const x = x0 + (d - ws + 1.6 * gap) * B
      if (Math.abs(x) > W / 2 + 1.5 * d) { el.style.visibility = 'hidden'; continue }
      el.style.visibility = 'visible'
      // roving tabindex: Tab lands on the active tape, arrows move it
      const ti = Math.abs(r) < 0.5 ? 0 : -1
      if (el.__ti !== ti) { el.__ti = ti; el.tabIndex = ti; if (ti) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current') }
      const target = el.__hover && Math.abs(r) > 0.5 && !S.blocked ? 1 : 0
      if (target) overSpine = true
      el.__lift += (target - el.__lift) * lk
      const o = smooth(Math.max(0, 1 - Math.abs(r)))
      const y = -o * 0.025 * H - el.__lift * 0.045 * H
      const z = o * 0.2 * H
      el.style.transform =
        `translate3d(${x}px,${y}px,${z}px) rotateZ(${-4.5 * o}deg) rotateX(${S.tiltX * o}deg) rotateY(${-90 * o + S.tiltY * o}deg)`
      el.style.zIndex = Math.round(100 - Math.abs(r) * 4)
      el.firstChild.style.setProperty('--shade', (o * 0.55).toFixed(3))
      el.lastChild.style.setProperty('--shade', ((1 - o) * 0.5).toFixed(3))
    }
    cursor.classList.toggle('spine', !S.onCover && overSpine)

    const ps = S.blocked || N === 0 || list[ai]?.placeholder ? 0 : smooth(Math.max(0, 1 - Math.abs(S.T - S.s) * 3))
    play.style.transform = `translate(-50%,-50%) scale(${ps})`
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  // ---------- inputs ----------
  const onMove = (e) => {
    S.mx = e.clientX; S.my = e.clientY
    if (S.drag && N > 1) {
      const dx = e.clientX - S.drag.x
      if (!S.dragging && Math.abs(dx) > 5) { S.dragging = true; S.moved = true }
      if (S.dragging) S.T = S.drag.T0 - dx / (geo.ws + geo.gap)
    }
  }
  const onUp = () => {
    if (!S.drag) return
    if (S.dragging) S.T = Math.round(S.T)
    S.drag = null; S.dragging = false
    setTimeout(() => { S.moved = false }, 0)
  }
  const onDown = (e) => {
    if (S.blocked) return
    S.drag = { x: e.clientX, T0: S.T }
    S.moved = false
  }
  const onOver = (e) => {
    const btn = e.target.closest && e.target.closest('button,a')
    cursor.classList.toggle('btn', !!btn && !shelf.contains(btn))
  }
  const onWheel = (e) => {
    if (S.blocked || N <= 1) return
    const dl = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    S.T += (dl / (geo.ws + geo.gap)) * 0.5
    clearTimeout(S.wheelTimer)
    S.wheelTimer = setTimeout(() => { S.T = Math.round(S.T) }, 160)
  }
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') step(-1)
    else if (e.key === 'ArrowRight') step(1)
  }
  shelf.addEventListener('pointerdown', onDown)
  addEventListener('pointermove', onMove)
  addEventListener('pointerup', onUp)
  addEventListener('pointercancel', onUp)
  addEventListener('mouseover', onOver)
  addEventListener('wheel', onWheel, { passive: true })
  addEventListener('keydown', onKey)
  addEventListener('resize', measure)

  return {
    setList, setLang, goTo, step, jumpTo, coverRect,
    setOpen: (b) => { S.blocked = b },
    activeIndex: () => S.active,
    current: () => (N ? list[mod(Math.round(S.T), N)] : null),
    cursorState: (cls, on) => cursor.classList.toggle(cls, on),
    destroy() {
      cancelAnimationFrame(raf)
      shelf.removeEventListener('pointerdown', onDown)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerup', onUp)
      removeEventListener('pointercancel', onUp)
      removeEventListener('mouseover', onOver)
      removeEventListener('wheel', onWheel)
      removeEventListener('keydown', onKey)
      removeEventListener('resize', measure)
      pool.forEach((el) => el.remove())
    },
  }
}
