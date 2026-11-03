import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../api/supabase.js'
import { BLOCK_TYPES, blocksToDoc, docToBlocks, slugify, completeness, publishIssues } from './doc.js'

const EMPTY = {
  slug: '', category: 'MAIN', chapter_label: '', title: { en: '', id: '' }, original_title: '', original_title_lang: '',
  romanised_title: '', version: '', version_group: '', region: '', characters: [], est_minutes: null, release_date: '',
  synopsis: { en: '', id: '' }, body: { en: null, id: null }, spine_media_id: null, cover_media_id: null,
  sort_key: 0, status: 'draft', publish_at: null, needs_review: false, source_url: '',
}

function BlockEditor({ blocks, onChange }) {
  const set = (i, patch) => onChange(blocks.map((b, k) => (k === i ? { ...b, ...patch } : b)))
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= blocks.length) return
    const n = [...blocks]; [n[i], n[j]] = [n[j], n[i]]; onChange(n)
  }
  return (
    <div className="blocks">
      {blocks.map((b, i) => (
        <div className="block" key={i}>
          <div className="block-tools">
            <select value={b.type} onChange={(e) => set(i, { type: e.target.value })}>
              {BLOCK_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button type="button" onClick={() => move(i, -1)}>↑</button>
            <button type="button" onClick={() => move(i, 1)}>↓</button>
            <button type="button" onClick={() => onChange(blocks.filter((_, k) => k !== i))}>✕</button>
          </div>
          {b.type === 'dialogue' && <input placeholder="Speaker" value={b.speaker || ''} onChange={(e) => set(i, { speaker: e.target.value })} />}
          {b.type === 'image' && <input placeholder="Image URL" value={b.src || ''} onChange={(e) => set(i, { src: e.target.value })} />}
          {b.type !== 'rule' && (
            <textarea
              rows={b.type === 'p' || b.type === 'quote' || b.type === 'choice' ? 4 : 2}
              placeholder={b.type === 'choice' ? 'One option per line' : b.type === 'image' ? 'Caption' : 'Text'}
              value={b.text || ''}
              onChange={(e) => set(i, { text: e.target.value })}
            />
          )}
        </div>
      ))}
      <button type="button" className="adm-btn" onClick={() => onChange([...blocks, { type: 'p', text: '' }])}>+ Add block</button>
    </div>
  )
}

export default function StoryEditor({ id }) {
  const isNew = id === 'new'
  const [s, setS] = useState(null)
  const [blocks, setBlocks] = useState({ en: [], id: [] })
  const [lang, setLang] = useState('en')
  const [cats, setCats] = useState([])
  const [groups, setGroups] = useState([])
  const [urls, setUrls] = useState({ spine: null, cover: null })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const tabsRef = useRef(null)
  const indRef = useRef(null)

  useEffect(() => {
    (async () => {
      const [c, g] = await Promise.all([
        supabase.from('categories').select('code,name').order('sort'),
        supabase.from('version_groups').select('label').order('sort'),
      ])
      setCats(c.data || []); setGroups(g.data || [])
      if (isNew) { setS({ ...EMPTY }); return }
      const { data, error } = await supabase
        .from('stories')
        .select('*, spine:media!stories_spine_media_id_fkey(url), cover:media!stories_cover_media_id_fkey(url)')
        .eq('id', id).single()
      if (error) return setMsg({ err: error.message })
      const { spine, cover, ...row } = data
      setS({ ...EMPTY, ...row, body: row.body || { en: null, id: null } })
      setBlocks({ en: docToBlocks(row.body?.en), id: docToBlocks(row.body?.id) })
      setUrls({ spine: spine?.url, cover: cover?.url })
    })()
  }, [id, isNew])

  useEffect(() => {
    const b = tabsRef.current?.querySelectorAll('button')[lang === 'en' ? 0 : 1]
    if (b && indRef.current) {
      indRef.current.style.width = b.offsetWidth + 'px'
      indRef.current.style.transform = `translateX(${b.offsetLeft}px)`
    }
  }, [lang, s])

  if (!s) return <p>{msg?.err || 'Loading…'}</p>

  const up = (patch) => setS((x) => ({ ...x, ...patch }))
  const upL = (field, l, v) => setS((x) => ({ ...x, [field]: { ...x[field], [l]: v } }))
  const full = (l) => ({ ...s, body: { ...s.body, [l]: blocksToDoc(blocks[l]) } })

  const upload = async (kind, file) => {
    if (!file) return
    setBusy(true)
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('media').upload(path, file)
    if (error) { setBusy(false); return setMsg({ err: error.message }) }
    const url = supabase.storage.from('media').getPublicUrl(path).data.publicUrl
    const { data, error: e2 } = await supabase.from('media').insert({ url, alt: { en: s.title.en, id: s.title.id } }).select().single()
    setBusy(false)
    if (e2) return setMsg({ err: e2.message })
    up({ [kind + '_media_id']: data.id })
    setUrls((u) => ({ ...u, [kind]: url }))
  }

  const save = async (andStay = true, dupe = false) => {
    setMsg(null)
    const body = { en: blocksToDoc(blocks.en), id: blocksToDoc(blocks.id) }
    const row = {
      ...s, body,
      slug: s.slug || slugify(s.title.en),
      characters: Array.isArray(s.characters) ? s.characters : [],
      original_title: s.original_title || null,
      original_title_lang: s.original_title_lang || null,
      romanised_title: s.romanised_title || null,
      version_group: s.version_group || null,
      release_date: s.release_date || null,
      est_minutes: s.est_minutes === '' ? null : s.est_minutes,
      source_url: s.source_url || null,
      publish_at: s.status === 'scheduled' ? s.publish_at : s.publish_at || null,
    }
    if (!row.slug) return setMsg({ err: 'Slug or English title required.' })
    if (!row.version) return setMsg({ err: 'Version required.' })
    if (row.status !== 'draft') {
      const miss = publishIssues(row)
      if (miss.length) return setMsg({ err: `Cannot ${row.status}: missing ${miss.join(', ')}. Save as draft or fill them in.` })
    }
    if (row.status === 'scheduled' && !row.publish_at) return setMsg({ err: 'Scheduled stories need publish_at.' })
    delete row.updated_by; delete row.updated_at
    setBusy(true)
    let res
    if (isNew || dupe) {
      delete row.id
      if (dupe) { row.slug = row.slug + '-copy'; row.status = 'draft'; row.sort_key = Number(s.sort_key) + 1 }
      else {
        const { data: last } = await supabase.from('stories').select('sort_key').order('sort_key', { ascending: false }).limit(1)
        row.sort_key = (last?.[0]?.sort_key ?? 0) + 100
      }
      res = await supabase.from('stories').insert(row).select('id').single()
    } else {
      res = await supabase.from('stories').update(row).eq('id', id).select('id').single()
    }
    setBusy(false)
    if (res.error) return setMsg({ err: res.error.message })
    setMsg({ ok: dupe ? 'Duplicated as draft.' : 'Saved.' })
    if (isNew || dupe) location.hash = `#/story/${res.data.id}`
  }

  const issues = publishIssues(s)

  return (
    <>
      <div className="adm-head">
        <h1><a href="#/stories">←</a> {isNew ? 'New story' : s.title.en || s.slug}</h1>
        <div className="adm-actions">
          {!isNew && <button className="adm-btn" disabled={busy} onClick={() => save(true, true)}>Duplicate</button>}
          <button className="adm-btn primary" disabled={busy} onClick={() => save()}>Save</button>
        </div>
      </div>
      {msg?.err && <p className="adm-err">{msg.err}</p>}
      {msg?.ok && <p className="adm-ok">{msg.ok}</p>}

      <div className="adm-grid">
        <section className="adm-card">
          <h2>Details</h2>
          <label>Slug<input value={s.slug} placeholder={slugify(s.title.en)} onChange={(e) => up({ slug: slugify(e.target.value) })} /></label>
          <div className="two">
            <label>Category
              <select value={s.category} onChange={(e) => up({ category: e.target.value })}>
                {cats.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name?.en}</option>)}
              </select>
            </label>
            <label>Chapter label<input value={s.chapter_label || ''} onChange={(e) => up({ chapter_label: e.target.value })} placeholder="CH. IV · ACT IV" /></label>
          </div>
          <div className="two">
            <label>Version<input value={s.version} onChange={(e) => up({ version: e.target.value })} placeholder="3.7" /></label>
            <label>Version group
              <select value={s.version_group || ''} onChange={(e) => up({ version_group: e.target.value })}>
                <option value="">—</option>{groups.map((g) => <option key={g.label}>{g.label}</option>)}
              </select>
            </label>
          </div>
          <div className="two">
            <label>Region<input value={s.region || ''} onChange={(e) => up({ region: e.target.value })} /></label>
            <label>Release date<input type="date" value={s.release_date || ''} onChange={(e) => up({ release_date: e.target.value })} /></label>
          </div>
          <label>Characters (comma separated)
            <input value={(s.characters || []).join(', ')} onChange={(e) => up({ characters: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
          </label>
          <div className="two">
            <label>Original title<input value={s.original_title || ''} onChange={(e) => up({ original_title: e.target.value })} /></label>
            <label>Original language
              <select value={s.original_title_lang || ''} onChange={(e) => up({ original_title_lang: e.target.value })}>
                <option value="">—</option><option value="zh-Hans">zh-Hans</option><option value="ja">ja</option>
              </select>
            </label>
          </div>
          <div className="two">
            <label>Est. minutes<input type="number" value={s.est_minutes ?? ''} onChange={(e) => up({ est_minutes: e.target.value === '' ? null : +e.target.value })} /></label>
            <label>Source URL (editors only)<input value={s.source_url || ''} onChange={(e) => up({ source_url: e.target.value })} /></label>
          </div>
        </section>

        <section className="adm-card">
          <h2>Publishing</h2>
          <div className="two">
            <label>Status
              <select value={s.status} onChange={(e) => up({ status: e.target.value })}>
                <option>draft</option><option>scheduled</option><option>published</option>
              </select>
            </label>
            <label>Publish at
              <input type="datetime-local" disabled={s.status !== 'scheduled'}
                value={s.publish_at ? new Date(s.publish_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => up({ publish_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </label>
          </div>
          <label className="chk"><input type="checkbox" checked={!!s.needs_review} onChange={(e) => up({ needs_review: e.target.checked })} /> needs review</label>
          {issues.length > 0 && <p className="adm-warn">To publish, still missing: {issues.join(', ')}</p>}
          <h2>Art (optional)</h2>
          <p className="sub">No art means a generated typographic tape is used.</p>
          {['spine', 'cover'].map((k) => (
            <label key={k}>{k === 'spine' ? 'Spine (142:840)' : 'Cover (474:900)'}
              {urls[k] && <img className="thumb" src={urls[k]} alt="" />}
              <input type="file" accept="image/*" disabled={busy} onChange={(e) => upload(k, e.target.files[0])} />
            </label>
          ))}
        </section>
      </div>

      <section className="adm-card wide">
        <div className="adm-tabs" ref={tabsRef}>
          <span className="ind" ref={indRef} />
          {['en', 'id'].map((l) => (
            <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
              {l === 'en' ? 'English' : 'Bahasa Indonesia'} <Dot s={completeness(full(l), l)} />
            </button>
          ))}
        </div>
        <label>Title ({lang})<input lang={lang} value={s.title[lang] || ''} onChange={(e) => upL('title', lang, e.target.value)} /></label>
        <label>Synopsis ({lang}) <small>{(s.synopsis[lang] || '').length}/260</small>
          <textarea lang={lang} rows={3} maxLength={260} value={s.synopsis[lang] || ''} onChange={(e) => upL('synopsis', lang, e.target.value)} />
        </label>
        <h2>Body ({lang})</h2>
        <BlockEditor blocks={blocks[lang]} onChange={(b) => setBlocks((x) => ({ ...x, [lang]: b }))} />
      </section>
    </>
  )
}

const Dot = ({ s }) => <i className={'dot ' + s} />
