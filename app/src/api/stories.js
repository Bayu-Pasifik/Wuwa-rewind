// Data layer. Reads Supabase when configured and seeded; otherwise falls back to public/seed.json.
// Callers (shelf, detail, reader) never know which source answered.
// Public reads use plain PostgREST fetches so supabase-js stays out of the public bundle (it lives in the admin chunk).
const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const hasRemote = !!(SB_URL && SB_KEY)
const rest = (path) =>
  fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }).then((r) => {
    if (!r.ok) throw new Error(`supabase ${r.status}`)
    return r.json()
  })

let cache

// List payload leaves out `body`; has_body_* flags say whether a write-up exists and getBody() fetches it on demand.
const LIST_COLS = 'id,slug,category,chapter_label,title,original_title,original_title_lang,romanised_title,version,version_group,region,characters,est_minutes,release_date,synopsis,sort_key,status,publish_at,source_url,has_body_en,has_body_id'
const bodies = new Map()

async function loadSeed() {
  const r = await fetch('/seed.json')
  if (!r.ok) throw new Error('seed.json ' + r.status)
  return r.json()
}

const mediaOf = (m) => (m ? { url: m.url, width: m.width, height: m.height, crop: m.crop, alt: m.alt } : null)

async function loadRemote() {
  // index.html starts these requests before the JS bundle arrives (window.__pre); same URLs, so a miss just refetches.
  const pre = window.__pre
  const use = (key, path, one) =>
    (pre?.[key] || rest(path)).catch(() => rest(path)).then((d) => ({ data: one ? d[0] ?? null : d, error: null }))
  const [cats, groups, vers, sets, stories] = await Promise.all([
    use('cats', 'categories?select=*&order=sort.asc'),
    use('groups', 'version_groups?select=*&order=sort.asc'),
    use('vers', 'versions?select=*&order=release_date.asc'),
    use('sets', 'site_settings?select=*&id=eq.1', true),
    use('stories', `stories?select=${encodeURIComponent(LIST_COLS + ', spine:media!stories_spine_media_id_fkey(*), cover:media!stories_cover_media_id_fkey(*)')}&order=sort_key.asc`),
  ])
  const err = [cats, groups, vers, sets, stories].find((x) => x.error)?.error
  if (err) throw err
  if (!stories.data.length || !sets.data) throw new Error('supabase empty')
  return {
    site_settings: sets.data,
    categories: cats.data,
    version_groups: groups.data,
    versions: vers.data,
    stories: stories.data.map(({ spine, cover, ...s }) => ({ ...s, spine_media: mediaOf(spine), cover_media: mediaOf(cover) })),
  }
}

async function load() {
  if (!cache) {
    cache = (async () => {
      if (hasRemote) {
        try {
          return await loadRemote()
        } catch (e) {
          console.warn('[cranellz] Supabase unavailable, using seed.json:', e.message || e)
        }
      }
      return loadSeed()
    })().then(synth)
  }
  return cache
}

// Dev-only perf harness: ?synth=500 clones the live stories up to N entries.
function synth(d) {
  const n = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('synth')) : 0
  if (!n || n <= d.stories.length) return d
  const base = d.stories.filter((s) => s.status === 'published')
  const stories = []
  for (let i = 0; i < n; i++) {
    const s = base[i % base.length]
    stories.push(i < base.length ? s : { ...s, slug: `${s.slug}-x${i}`, sort_key: s.sort_key + i * 0.001 })
  }
  return { ...d, stories }
}

export const invalidate = () => { cache = null }

const isLive = (s, now = Date.now()) =>
  s.status === 'published' || (s.status === 'scheduled' && s.publish_at && Date.parse(s.publish_at) <= now)

export async function getSettings() {
  return (await load()).site_settings
}

export async function getMeta() {
  const d = await load()
  return { categories: d.categories, versionGroups: d.version_groups, versions: d.versions }
}

export async function listStories() {
  const d = await load()
  return d.stories.filter((s) => isLive(s)).sort((a, b) => a.sort_key - b.sort_key)
}

export async function getBody(slug) {
  if (bodies.has(slug)) return bodies.get(slug)
  let p
  if (hasRemote) {
    p = rest(`stories?select=body&slug=eq.${encodeURIComponent(slug)}`).then((d) => d[0]?.body || { en: null, id: null })
  } else {
    p = getStory(slug).then((s) => s?.body || { en: null, id: null })
  }
  p = p.catch((e) => { bodies.delete(slug); throw e })
  bodies.set(slug, p)
  return p
}

export async function getStory(slug) {
  return (await listStories()).find((s) => s.slug === slug) || null
}
