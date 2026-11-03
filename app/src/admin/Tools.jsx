import React, { useState } from 'react'
import { supabase } from '../api/supabase.js'

const COLS = ['slug', 'category', 'chapter_label', 'title', 'original_title', 'original_title_lang', 'romanised_title', 'version', 'version_group', 'region', 'characters', 'est_minutes', 'release_date', 'synopsis', 'body', 'sort_key', 'status', 'publish_at', 'needs_review', 'source_url']
const pick = (o) => Object.fromEntries(COLS.map((k) => [k, o[k] ?? null]))
const norm = (o) => JSON.stringify(pick(o), (_k, v) => (v === '' ? null : v))

export default function Tools() {
  const [plan, setPlan] = useState(null)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const onFile = async (file) => {
    setMsg(null); setPlan(null)
    if (!file) return
    let json
    try { json = JSON.parse(await file.text()) } catch { return setMsg({ err: 'Not valid JSON.' }) }
    const incoming = Array.isArray(json) ? json : json.stories
    if (!Array.isArray(incoming)) return setMsg({ err: 'Expected an array or { stories: [...] }.' })
    const { data, error } = await supabase.from('stories').select(COLS.join(','))
    if (error) return setMsg({ err: error.message })
    const have = new Map(data.map((r) => [r.slug, r]))
    const created = [], changed = [], same = [], errors = []
    incoming.forEach((s) => {
      if (!s.slug || !s.title?.en || !s.category || !s.version) return errors.push(`${s.slug || '(no slug)'}: slug, title.en, category, version required`)
      const cur = have.get(s.slug)
      if (!cur) created.push(s)
      else if (norm(cur) !== norm(s)) changed.push(s)
      else same.push(s)
    })
    setPlan({ created, changed, same, errors, rows: [...created, ...changed].map(pick) })
  }

  const apply = async () => {
    setBusy(true)
    let done = 0
    for (let i = 0; i < plan.rows.length; i += 25) {
      const chunk = plan.rows.slice(i, i + 25)
      const { error } = await supabase.from('stories').upsert(chunk, { onConflict: 'slug' })
      if (error) { setBusy(false); return setMsg({ err: `${error.message} (after ${done} rows)` }) }
      done += chunk.length
    }
    setBusy(false); setPlan(null)
    setMsg({ ok: `Imported ${done} stories.` })
  }

  const exportAll = async () => {
    const [st, c, g, v, set] = await Promise.all([
      supabase.from('stories').select(COLS.join(',')).order('sort_key'),
      supabase.from('categories').select('*').order('sort'),
      supabase.from('version_groups').select('*').order('sort'),
      supabase.from('versions').select('*').order('release_date'),
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    ])
    const err = [st, c, g, v, set].find((x) => x.error)?.error
    if (err) return setMsg({ err: err.message })
    const blob = new Blob([JSON.stringify({ generated: new Date().toISOString(), site_settings: set.data, categories: c.data, version_groups: g.data, versions: v.data, stories: st.data }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cranellz-export.json'
    a.click()
  }

  return (
    <>
      <div className="adm-head"><h1>Import / Export</h1></div>
      {msg?.err && <p className="adm-err">{msg.err}</p>}
      {msg?.ok && <p className="adm-ok">{msg.ok}</p>}
      <section className="adm-card">
        <h2>Export</h2>
        <p className="sub">Everything (stories, categories, version groups, versions, settings) as one JSON file.</p>
        <button className="adm-btn" onClick={exportAll}>Download JSON</button>
      </section>
      <section className="adm-card">
        <h2>Import (upsert by slug)</h2>
        <p className="sub">Pick a file first to see a dry-run diff. Nothing is written until you apply.</p>
        <input type="file" accept="application/json" onChange={(e) => onFile(e.target.files[0])} />
        {plan && (
          <div className="plan">
            <p><b>{plan.created.length}</b> new · <b>{plan.changed.length}</b> changed · <b>{plan.same.length}</b> unchanged · <b>{plan.errors.length}</b> errors</p>
            {plan.errors.length > 0 && <ul className="adm-err">{plan.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
            <details><summary>New ({plan.created.length})</summary><ul>{plan.created.map((s) => <li key={s.slug}>{s.slug}</li>)}</ul></details>
            <details><summary>Changed ({plan.changed.length})</summary><ul>{plan.changed.map((s) => <li key={s.slug}>{s.slug}</li>)}</ul></details>
            <button className="adm-btn primary" disabled={busy || !plan.rows.length} onClick={apply}>Apply {plan.rows.length} changes</button>
          </div>
        )}
      </section>
    </>
  )
}
