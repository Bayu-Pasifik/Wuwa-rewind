// Client-side SEO: title, description, canonical, hreflang and Open Graph for the current story.
const set = (sel, make, attrs) => {
  let el = document.head.querySelector(sel)
  if (!el) { el = document.createElement(make); document.head.appendChild(el) }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
}

export function setSeo(story, lang, title, description) {
  const base = location.origin
  const path = story && !story.placeholder ? `/story/${story.slug}` : '/'
  const url = (l) => base + (l === 'id' ? '/id' : '') + (path === '/' ? (l === 'id' ? '/' : '') : path)
  const desc = description || 'Unofficial fan archive of Wuthering Waves story content.'
  document.title = title
  set('meta[name="description"]', 'meta', { name: 'description', content: desc })
  set('link[rel="canonical"]', 'link', { rel: 'canonical', href: url(lang) })
  for (const l of ['en', 'id']) set(`link[hreflang="${l}"]`, 'link', { rel: 'alternate', hreflang: l, href: url(l) })
  set('link[hreflang="x-default"]', 'link', { rel: 'alternate', hreflang: 'x-default', href: url('en') })
  set('meta[property="og:title"]', 'meta', { property: 'og:title', content: title })
  set('meta[property="og:description"]', 'meta', { property: 'og:description', content: desc })
  set('meta[property="og:url"]', 'meta', { property: 'og:url', content: url(lang) })
  set('meta[property="og:locale"]', 'meta', { property: 'og:locale', content: lang === 'id' ? 'id_ID' : 'en_US' })
  const cover = story && (typeof story.cover_media === 'string' ? story.cover_media : story.cover_media?.url)
  if (cover) set('meta[property="og:image"]', 'meta', { property: 'og:image', content: cover })
}
