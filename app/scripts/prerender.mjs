// Post-build prerender (T4.5): writes dist/story/<slug>/index.html and dist/id/story/<slug>/index.html
// with per-story title, description, canonical, hreflang and OG tags baked in, plus sitemap.xml.
// The SPA still boots on top of it. Reads published stories from Supabase over REST (RLS limits to live rows).
import fs from 'node:fs'
import path from 'node:path'

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const dist = path.join(root, 'dist')

const env = { ...process.env }
for (const f of ['.env.local', '.env']) {
  const p = path.join(root, f)
  if (!fs.existsSync(p)) continue
  for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const i = l.indexOf('=')
    if (i > 0 && !l.startsWith('#') && env[l.slice(0, i)] === undefined) env[l.slice(0, i)] = l.slice(i + 1).trim()
  }
}
const site = (env.SITE_URL || '').replace(/\/+$/, '')
if (!site) console.warn('prerender: SITE_URL not set, canonical/hreflang/sitemap use relative URLs')
const url = env.VITE_SUPABASE_URL, key = env.VITE_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('prerender: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing')

const res = await fetch(
  `${url}/rest/v1/stories?select=slug,title,synopsis,release_date,cover:media!stories_cover_media_id_fkey(url)&status=eq.published&order=sort_key`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } })
if (!res.ok) throw new Error('prerender: fetch failed ' + res.status + ' ' + (await res.text()))
const stories = await res.json()

const tpl = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const pathFor = (slug, l) => (l === 'id' ? '/id' : '') + (slug ? `/story/${slug}` : '/')
const abs = (p) => site + p

function render(s, lang) {
  const title = `${s.title[lang]} — Cranellz`
  const desc = s.synopsis?.[lang] || ''
  const lc = lang === 'id' ? 'id_ID' : 'en_US'
  const head = [
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(abs(pathFor(s.slug, lang)))}" />`,
    `<link rel="alternate" hreflang="en" href="${esc(abs(pathFor(s.slug, 'en')))}" />`,
    `<link rel="alternate" hreflang="id" href="${esc(abs(pathFor(s.slug, 'id')))}" />`,
    `<link rel="alternate" hreflang="x-default" href="${esc(abs(pathFor(s.slug, 'en')))}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(abs(pathFor(s.slug, lang)))}" />`,
    `<meta property="og:locale" content="${lc}" />`,
    s.cover?.url ? `<meta property="og:image" content="${esc(s.cover.url)}" />` : '',
  ].filter(Boolean).join('\n')
  return tpl
    .replace('<html lang="en">', `<html lang="${lang}">`)
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', head + '\n</head>')
    .replace(/<div id="root">[\s\S]*?<\/div><\/div>/, `<div id="root"><article><h1>${esc(s.title[lang])}</h1><p>${esc(desc)}</p></article></div>`)
}

let n = 0
for (const s of stories) {
  for (const lang of ['en', 'id']) {
    if (!s.title?.[lang]) continue
    const dir = path.join(dist, ...pathFor(s.slug, lang).split('/').filter(Boolean))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), render(s, lang))
    n++
  }
}
fs.writeFileSync(path.join(dist, '404.html'), tpl) // SPA fallback for /story/:slug/read etc.

const urls = ['/', '/id/', ...stories.flatMap((s) => ['en', 'id'].map((l) => pathFor(s.slug, l)))]
fs.writeFileSync(path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(abs(u))}</loc></url>`).join('\n')}\n</urlset>\n`)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ''}`)
console.log(`prerender: ${n} pages for ${stories.length} stories`)
