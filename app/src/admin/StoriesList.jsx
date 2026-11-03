import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../api/supabase.js'
import { completeness } from './doc.js'

const Dot = ({ s }) => <i className={'dot ' + s} title={s} />

export default function StoriesList() {
  const [rows, setRows] = useState(null)
  const [cats, setCats] = useState([])
  const [groups, setGroups] = useState([])
  const [err, setErr] = useState('')
  const [f, setF] = useState({ q: '', category: '', group: '', status: '', review: false })
  const dragId = useRef(null)

  const load = async () => {
    const [s, c, g] = await Promise.all([
      supabase.from('stories').select('id,slug,category,chapter_label,title,synopsis,body,version,version_group,characters,status,needs_review,sort_key,publish_at').order('sort_key'),
      supabase.from('categories').select('code,name').order('sort'),
      supabase.from('version_groups').select('label').order('sort'),
    ])
    if (s.error) return setErr(s.error.message)
    setRows(s.data); setCats(c.data || []); setGroups(g.data || [])
  }
  useEffect(() => { load() }, [])

  const shown = useMemo(() => {
    if (!rows) return []
    const q = f.q.trim().toLowerCase()
    return rows.filter((r) =>
      (!f.category || r.category === f.category) &&
      (!f.group || r.version_group === f.group) &&
      (!f.status || r.status === f.status) &&
      (!f.review || r.needs_review) &&
      (!q || [r.title?.en, r.title?.id, r.slug, ...(r.characters || [])].some((x) => (x || '').toLowerCase().includes(q))))
  }, [rows, f])

  // drag reorder: new sort_key is the midpoint between the drop target's neighbours in the full list
  const drop = async (targetId) => {
    const id = dragId.current
    dragId.current = null
    if (!id || id === targetId) return
    const from = rows.findIndex((r) => r.id === id)
    const to = rows.findIndex((r) => r.id === targetId)
    const without = rows.filter((r) => r.id !== id)
    const t = without.findIndex((r) => r.id === targetId)
    const before = from < to ? without[t] : without[t - 1]
    const after = from < to ? without[t + 1] : without[t]
    const a = before ? Number(before.sort_key) : Number(after.sort_key) - 100
    const b = after ? Number(after.sort_key) : Number(before.sort_key) + 100
    const key = (a + b) / 2
    const { error } = await supabase.from('stories').update({ sort_key: key }).eq('id', id)
    if (error) return setErr(error.message)
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, sort_key: key } : r)).sort((x, y) => x.sort_key - y.sort_key))
  }

  if (err) return <p className="adm-err">{err}</p>
  if (!rows) return <p>Loading…</p>

  return (
    <>
      <div className="adm-head">
        <h1>Stories <small>{shown.length} / {rows.length}</small></h1>
        <a className="adm-btn primary" href="#/story/new">+ New story</a>
      </div>
      <div className="adm-filters">
        <input placeholder="Search title (EN/ID), slug, character" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.code} value={c.code}>{c.name?.en}</option>)}
        </select>
        <select value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })}>
          <option value="">All versions</option>
          {groups.map((g) => <option key={g.label}>{g.label}</option>)}
        </select>
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">Any status</option><option>draft</option><option>scheduled</option><option>published</option>
        </select>
        <label className="chk"><input type="checkbox" checked={f.review} onChange={(e) => setF({ ...f, review: e.target.checked })} /> needs review</label>
      </div>
      <table className="adm-table">
        <thead><tr><th /><th>Title</th><th>Cat</th><th>Ver</th><th>Chapter</th><th>EN</th><th>ID</th><th>Status</th></tr></thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.id} draggable onDragStart={() => (dragId.current = r.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(r.id)}>
              <td className="grip" title="Drag to reorder">⋮⋮</td>
              <td><a href={`#/story/${r.id}`}>{r.title?.en || r.slug}</a>{r.needs_review && <span className="tag warn">review</span>}<div className="sub">{r.title?.id}</div></td>
              <td>{r.category}</td>
              <td>{r.version}</td>
              <td>{r.chapter_label}</td>
              <td><Dot s={completeness(r, 'en')} /></td>
              <td><Dot s={completeness(r, 'id')} /></td>
              <td><span className={'tag ' + r.status}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
