// Warms the browser cache for the 7 tapes around the active one (active ±3, wrapping). No-op for generated tapes.
const seen = new Set()
const urlOf = (m) => (typeof m === 'string' ? m : m?.url)

export function preloadAround(list, index, span = 3) {
  const n = list.length
  if (!n || index < 0) return
  for (let d = -span; d <= span; d++) {
    const s = list[(((index + d) % n) + n) % n]
    for (const u of [urlOf(s?.spine_media), urlOf(s?.cover_media)]) {
      if (!u || seen.has(u)) continue
      seen.add(u)
      const img = new Image()
      img.decoding = 'async'
      img.src = u
    }
  }
}
