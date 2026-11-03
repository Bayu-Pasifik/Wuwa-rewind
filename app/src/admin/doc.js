// Block list <-> TipTap JSON (the same node shapes the public reader renders).
export const BLOCK_TYPES = [
  ['p', 'Paragraph'],
  ['h2', 'Part heading (H2)'],
  ['h3', 'Sub heading (H3)'],
  ['quote', 'Blockquote'],
  ['dialogue', 'Dialogue'],
  ['choice', 'Choice'],
  ['image', 'Image'],
  ['rule', 'Rule'],
]

const txt = (s) => (s ? [{ type: 'text', text: s }] : [])

export function blocksToDoc(blocks) {
  const content = blocks
    .map((b) => {
      switch (b.type) {
        case 'p': return b.text?.trim() ? { type: 'paragraph', content: txt(b.text) } : null
        case 'h2': return { type: 'heading', attrs: { level: 2 }, content: txt(b.text) }
        case 'h3': return { type: 'heading', attrs: { level: 3 }, content: txt(b.text) }
        case 'quote': return { type: 'blockquote', content: [{ type: 'paragraph', content: txt(b.text) }] }
        case 'dialogue': return { type: 'dialogue', attrs: { speaker: b.speaker || '' }, content: txt(b.text) }
        case 'choice': return { type: 'choice', attrs: { options: (b.text || '').split('\n').map((x) => x.trim()).filter(Boolean) } }
        case 'image': return { type: 'image', attrs: { src: b.src || '', caption: b.text || '', alt: b.text || '' } }
        case 'rule': return { type: 'horizontalRule' }
        default: return null
      }
    })
    .filter(Boolean)
  return content.length ? { type: 'doc', content } : null
}

const plain = (n) => (n.type === 'text' ? n.text || '' : (n.content || []).map(plain).join(''))

export function docToBlocks(doc) {
  if (!doc || !Array.isArray(doc.content)) return []
  return doc.content.map((n) => {
    switch (n.type) {
      case 'paragraph': return { type: 'p', text: plain(n) }
      case 'heading': return { type: n.attrs?.level === 3 ? 'h3' : 'h2', text: plain(n) }
      case 'blockquote': return { type: 'quote', text: plain(n) }
      case 'dialogue': return { type: 'dialogue', speaker: n.attrs?.speaker || '', text: plain(n) }
      case 'choice': return { type: 'choice', text: (n.attrs?.options || []).join('\n') }
      case 'image': return { type: 'image', src: n.attrs?.src || '', text: n.attrs?.caption || '' }
      case 'horizontalRule': case 'rule': return { type: 'rule' }
      default: return { type: 'p', text: plain(n) }
    }
  })
}

export const slugify = (s) =>
  (s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** Completeness of one language: 'empty' | 'partial' | 'complete' (title + synopsis + body). */
export function completeness(story, lang) {
  const got = [story.title?.[lang], story.synopsis?.[lang], story.body?.[lang]?.content?.length].filter(Boolean).length
  return got === 0 ? 'empty' : got === 3 ? 'complete' : 'partial'
}

export function publishIssues(s) {
  const miss = []
  ;['en', 'id'].forEach((l) => {
    if (!s.title?.[l]?.trim()) miss.push(`title.${l}`)
    if (!s.synopsis?.[l]?.trim()) miss.push(`synopsis.${l}`)
  })
  return miss
}
