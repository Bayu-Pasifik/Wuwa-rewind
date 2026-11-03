import React from 'react'
import { t } from './i18n/index.js'

// Logo from site_settings: brand_cjk line when present, else Newsreader wordmark + bilingual tagline.
export default function Logo({ settings, lang }) {
  const cjk = settings?.brand_cjk
  const latin = settings?.brand_latin || 'CRANELLZ'
  return (
    <div className="logo">
      {cjk ? (
        <>
          <span className="l1" lang="zh-Hans">{cjk}</span>
          <span className="l2">{latin}</span>
        </>
      ) : (
        <>
          <span className="l1 latin">{latin.charAt(0) + latin.slice(1).toLowerCase()}</span>
          <span className="l2 small">STORY ARCHIVE / ARSIP CERITA</span>
        </>
      )}
    </div>
  )
}
