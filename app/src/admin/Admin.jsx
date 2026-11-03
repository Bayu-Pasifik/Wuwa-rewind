import React, { useEffect, useState } from 'react'
import { supabase } from '../api/supabase.js'
import StoriesList from './StoriesList.jsx'
import StoryEditor from './StoryEditor.jsx'
import Tools from './Tools.jsx'
import Settings from './Settings.jsx'
import './admin.css'

const useHash = () => {
  const [h, setH] = useState(location.hash || '#/stories')
  useEffect(() => {
    const f = () => setH(location.hash || '#/stories')
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return h
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle')
  const [msg, setMsg] = useState('')
  const send = async (e) => {
    e.preventDefault()
    setState('sending')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/admin' } })
    if (error) { setState('error'); setMsg(error.message) } else setState('sent')
  }
  return (
    <div className="adm-center">
      <form onSubmit={send} className="adm-card">
        <h1>Cranellz admin</h1>
        {state === 'sent' ? (
          <p>Magic link sent to <b>{email}</b>. Open it on this device.</p>
        ) : (
          <>
            <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></label>
            <button className="adm-btn primary" disabled={state === 'sending'}>Send magic link</button>
            {state === 'error' && <p className="adm-err">{msg}</p>}
          </>
        )}
      </form>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState(undefined)
  const [role, setRole] = useState(undefined)
  const hash = useHash()

  useEffect(() => {
    document.body.classList.add('admin')
    return () => document.body.classList.remove('admin')
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setRole(session === null ? null : undefined); return }
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setRole(data?.role || null))
  }, [session])

  if (!supabase) return <div className="adm-center"><div className="adm-card">Supabase is not configured (.env.local).</div></div>
  if (session === undefined) return <div className="adm-center">Loading…</div>
  if (!session) return <SignIn />
  if (role === undefined) return <div className="adm-center">Checking role…</div>
  if (!role)
    return (
      <div className="adm-center">
        <div className="adm-card">
          <h1>No access</h1>
          <p>{session.user.email} is signed in but has no editor role. Ask an admin to add a row in <code>profiles</code>.</p>
          <button className="adm-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    )

  const [, route = 'stories', arg] = hash.replace(/^#/, '').split('/')
  const nav = [['stories', 'Stories'], ['tools', 'Import / Export'], ['settings', 'Settings']]

  return (
    <div className="adm">
      <header className="adm-bar">
        <a className="adm-brand" href="#/stories">Cranellz <span>admin</span></a>
        <nav>
          {nav.map(([k, l]) => (
            <a key={k} href={`#/${k}`} className={route === k || (k === 'stories' && route === 'story') ? 'on' : ''}>{l}</a>
          ))}
        </nav>
        <div className="adm-user">
          <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <span>{session.user.email} · {role}</span>
          <button className="adm-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>
      <main className="adm-main">
        {route === 'story' ? <StoryEditor key={arg} id={arg} /> : null}
        {route === 'stories' ? <StoriesList /> : null}
        {route === 'tools' ? <Tools /> : null}
        {route === 'settings' ? <Settings role={role} /> : null}
      </main>
    </div>
  )
}
