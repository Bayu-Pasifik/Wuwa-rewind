// Data layer. Reads Supabase when configured and seeded; otherwise falls back to public/seed.json.
// Callers (shelf, detail, reader) never know which source answered.
import { supabase } from './supabase.js'

let cache

async function loadSeed() {
  const r = await fetch('/seed.json')
  if (!r.ok) throw new Error('seed.json ' + r.status)
  return r.json()
}

const mediaOf = (m) => (m ? { url: m.url, width: m.width, height: m.height, crop: m.crop, alt: m.alt } : null)

async function loadRemote() {
  const [cats, groups, vers, sets, stories] = await Promise.all([
    supabase.from('categories').select('*').order('sort'),
    supabase.from('version_groups').select('*').order('sort'),
    supabase.from('versions').select('*').order('release_date'),
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    supabase
      .from('stories')
      .select('*, spine:media!stories_spine_media_id_fkey(*), cover:media!stories_cover_media_id_fkey(*)')
      .order('sort_key'),
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
      if (supabase) {
        try {
          return await loadRemote()
        } catch (e) {
          console.warn('[cranellz] Supabase unavailable, using seed.json:', e.message || e)
        }
      }
      return loadSeed()
    })()
  }
  return cache
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

export async function getStory(slug) {
  return (await listStories()).find((s) => s.slug === slug) || null
}
