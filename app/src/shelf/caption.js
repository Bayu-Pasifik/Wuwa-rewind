import { loc, t, other } from '../i18n/index.js'
import { titleOf } from './tape.js'

const EASE = 'cubic-bezier(.2,.8,.2,1)'

export function captionTexts(story, lang, categories) {
  if (story.placeholder) return [titleOf(story, lang), '', '']
  const o = other(lang)
  const sub = [loc(story.title, o), story.original_title].filter(Boolean).join(' / ')
  const cat = categories?.find((c) => c.code === story.category)
  const catName = (cat && loc(cat.name, lang)) || story.category
  const meta = [catName, `${t(lang, 'ver')} ${story.version}`, story.chapter_label].filter(Boolean).join(' · ')
  return [titleOf(story, lang), sub, meta]
}

/** Slide new text in through each masked line, old text out the other way. */
export function swapCaption(masks, texts, dir, reduced, lang) {
  masks.forEach((mask, i) => {
    if (!mask) return
    if (reduced) {
      mask.replaceChildren()
      const sp = document.createElement('span')
      sp.textContent = texts[i]
      mask.appendChild(sp)
      return
    }
    mask.querySelectorAll('span').forEach((old) => {
      if (old.dataset.leaving) return
      old.dataset.leaving = '1'
      const from = getComputedStyle(old).transform
      const a = old.animate(
        [{ transform: from === 'none' ? 'translateY(0)' : from }, { transform: `translateY(${-dir * 105}%)` }],
        { duration: 650, easing: EASE, fill: 'both' })
      a.onfinish = () => old.remove()
    })
    const sp = document.createElement('span')
    sp.textContent = texts[i]
    if (i === 0) sp.lang = lang
    mask.appendChild(sp)
    sp.animate(
      [{ transform: `translateY(${dir * 105}%)` }, { transform: 'translateY(0)' }],
      { duration: 650, easing: EASE, fill: 'both' })
  })
}
