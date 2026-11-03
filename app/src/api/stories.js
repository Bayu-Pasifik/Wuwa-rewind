// M1 data layer: reads public/seed.json. Swap for Supabase in M3 without touching callers.
let cache

async function load() {
  if (!cache) {
    cache = fetch('/seed.json').then((r) => {
      if (!r.ok) throw new Error('seed.json ' + r.status)
      return r.json()
    })
  }
  return cache
}

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
  const list = await listStories()
  return list.find((s) => s.slug === slug) || null
}
