import React, { useEffect, useState } from 'react'
import { supabase } from '../api/supabase.js'

function Table({ table, pk, cols, title }) {
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState(null)
  const load = () => supabase.from(table).select('*').order(cols.find((c) => c.sort)?.key || pk).then(({ data, error }) => (error ? setMsg(error.message) : setRows(data)))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const setCell = (i, k, v) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const save = async (row) => {
    const { error } = await supabase.from(table).upsert(row)
    setMsg(error ? error.message : 'Saved.')
  }
  const add = () => setRows((r) => [...r, Object.fromEntries([[pk, ''], ...cols.map((c) => [c.key, c.json ? {} : c.num ? 0 : ''])])])
  if (!rows) return <p>{msg || 'Loading…'}</p>
  const val = (c, v) => (c.json ? (typeof v === 'string' ? v : JSON.stringify(v ?? {})) : v ?? '')
  const parse = (c, v) => (c.json ? (() => { try { return JSON.parse(v) } catch { return v } })() : c.num ? Number(v) : v)
  return (
    <section className="adm-card wide">
      <h2>{title}</h2>
      {msg && <p className="sub">{msg}</p>}
      <table className="adm-table">
        <thead><tr><th>{pk}</th>{cols.map((c) => <th key={c.key}>{c.key}</th>)}<th /></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><input value={r[pk]} onChange={(e) => setCell(i, pk, e.target.value)} /></td>
              {cols.map((c) => <td key={c.key}><input value={val(c, r[c.key])} onChange={(e) => setCell(i, c.key, parse(c, e.target.value))} /></td>)}
              <td><button className="adm-btn" onClick={() => save({ ...r, ...Object.fromEntries(cols.filter((c) => c.json && typeof r[c.key] === 'string').map((c) => [c.key, JSON.parse(r[c.key])])) })}>Save</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="adm-btn" onClick={add}>+ Add</button>
    </section>
  )
}

export default function Settings({ role }) {
  const [s, setS] = useState(null)
  const [msg, setMsg] = useState(null)
  useEffect(() => {
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => setS(data || { id: 1, brand_latin: 'CRANELLZ', social_links: [], disclaimer: { en: '', id: '' }, default_locale: 'en', locales: ['en', 'id'] }))
  }, [])
  if (!s) return <p>Loading…</p>
  const up = (p) => setS((x) => ({ ...x, ...p }))
  const save = async () => {
    const { error } = await supabase.from('site_settings').upsert({ ...s, id: 1 })
    setMsg(error ? { err: error.message } : { ok: 'Saved. Reload the public site to see changes.' })
  }
  return (
    <>
      <div className="adm-head"><h1>Settings</h1><button className="adm-btn primary" onClick={save} disabled={role !== 'admin'}>Save</button></div>
      {role !== 'admin' && <p className="adm-warn">Only admins can change site settings.</p>}
      {msg?.err && <p className="adm-err">{msg.err}</p>}
      {msg?.ok && <p className="adm-ok">{msg.ok}</p>}
      <section className="adm-card wide">
        <div className="two">
          <label>Brand (Latin)<input value={s.brand_latin || ''} onChange={(e) => up({ brand_latin: e.target.value })} /></label>
          <label>Brand (CJK logo line)<input value={s.brand_cjk || ''} onChange={(e) => up({ brand_cjk: e.target.value || null })} /></label>
        </div>
        <div className="two">
          <label>Back link URL<input value={s.back_link_url || ''} onChange={(e) => up({ back_link_url: e.target.value || null })} /></label>
          <label>Default story slug<input value={s.default_story_slug || ''} onChange={(e) => up({ default_story_slug: e.target.value })} /></label>
        </div>
        <div className="two">
          <label>Disclaimer (EN)<textarea rows={3} value={s.disclaimer?.en || ''} onChange={(e) => up({ disclaimer: { ...s.disclaimer, en: e.target.value } })} /></label>
          <label>Disclaimer (ID)<textarea rows={3} value={s.disclaimer?.id || ''} onChange={(e) => up({ disclaimer: { ...s.disclaimer, id: e.target.value } })} /></label>
        </div>
        <div className="two">
          <label>Default locale
            <select value={s.default_locale} onChange={(e) => up({ default_locale: e.target.value })}><option>en</option><option>id</option></select>
          </label>
          <label>Social links (JSON: [{'{'}"label":"FB","url":"..."{'}'}])
            <input value={JSON.stringify(s.social_links || [])} onChange={(e) => { try { up({ social_links: JSON.parse(e.target.value) }) } catch { /* typing */ } }} />
          </label>
        </div>
      </section>
      <Table table="categories" pk="code" title="Categories" cols={[{ key: 'name', json: true }, { key: 'name_jp' }, { key: 'sort', num: true, sort: true }]} />
      <Table table="version_groups" pk="label" title="Version groups" cols={[{ key: 'label_jp' }, { key: 'sort', num: true, sort: true }]} />
      <Table table="versions" pk="version" title="Versions" cols={[{ key: 'name' }, { key: 'release_date', sort: true }]} />
    </>
  )
}
