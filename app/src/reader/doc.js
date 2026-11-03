// TipTap JSON helpers.
const hasText = (n) => !!n && ((n.type === 'text' && n.text && n.text.trim()) || (n.content || []).some(hasText))

export function hasBody(doc) {
  if (!doc || !Array.isArray(doc.content)) return false
  return doc.content.some((n) => hasText(n) || ['image', 'horizontalRule', 'rule', 'choice', 'dialogue'].includes(n.type))
}

export const blocksOf = (doc) => (doc && Array.isArray(doc.content) ? doc.content : [])

export function plain(n) {
  if (!n) return ''
  if (n.type === 'text') return n.text || ''
  return (n.content || []).map(plain).join(n.type === 'doc' ? '\n' : '')
}
