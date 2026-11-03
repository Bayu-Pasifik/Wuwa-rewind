// node supabase/make_seed_sql.mjs  ->  supabase/seed.sql  (paste into the SQL Editor after schema.sql)
import fs from 'node:fs'
const s = JSON.parse(fs.readFileSync(new URL('../seed.json', import.meta.url), 'utf8'))
const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const j = (v) => (v == null ? 'null' : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`)
const arr = (a) => `array[${(a || []).map(q).join(',')}]::text[]`
const out = ['begin;']
for (const c of s.categories)
  out.push(`insert into categories (code,name,name_jp,sort) values (${q(c.code)},${j(c.name)},${q(c.name_jp)},${c.sort}) on conflict (code) do update set name=excluded.name,name_jp=excluded.name_jp,sort=excluded.sort;`)
for (const g of s.version_groups)
  out.push(`insert into version_groups (label,label_jp,sort) values (${q(g.label)},${q(g.label_jp)},${g.sort}) on conflict (label) do update set sort=excluded.sort;`)
for (const v of s.versions)
  out.push(`insert into versions (version,name,release_date) values (${q(v.version)},${q(v.name)},${q(v.release_date)}) on conflict (version) do update set name=excluded.name,release_date=excluded.release_date;`)
const st = s.site_settings
out.push(
  `insert into site_settings (id,brand_latin,brand_cjk,top_right_label,back_link_url,social_links,disclaimer,default_story_slug,default_locale,locales) values (1,${q(st.brand_latin)},${q(st.brand_cjk)},${j(st.top_right_label)},${q(st.back_link_url)},${j(st.social_links || [])},${j(st.disclaimer)},${q(st.default_story_slug)},${q(st.default_locale)},${arr(st.locales)}) on conflict (id) do update set brand_latin=excluded.brand_latin,top_right_label=excluded.top_right_label,disclaimer=excluded.disclaimer,default_story_slug=excluded.default_story_slug,default_locale=excluded.default_locale,locales=excluded.locales;`)
for (const x of s.stories)
  out.push(
    `insert into stories (slug,category,chapter_label,title,original_title,original_title_lang,romanised_title,version,version_group,region,characters,est_minutes,release_date,synopsis,body,sort_key,status,publish_at,needs_review,source_url) values (${q(x.slug)},${q(x.category)},${q(x.chapter_label)},${j(x.title)},${q(x.original_title)},${q(x.original_title_lang)},${q(x.romanised_title)},${q(x.version)},${q(x.version_group)},${q(x.region)},${arr(x.characters)},${x.est_minutes ?? 'null'},${q(x.release_date)},${j(x.synopsis)},${j(x.body)},${x.sort_key},${q(x.status)},${q(x.publish_at)},${!!x.needs_review},${q(x.source_url)}) on conflict (slug) do update set category=excluded.category,chapter_label=excluded.chapter_label,title=excluded.title,version=excluded.version,version_group=excluded.version_group,region=excluded.region,characters=excluded.characters,synopsis=excluded.synopsis,body=excluded.body,sort_key=excluded.sort_key,status=excluded.status,needs_review=excluded.needs_review,source_url=excluded.source_url;`)
out.push('commit;')
fs.writeFileSync(new URL('./seed.sql', import.meta.url), out.join('\n') + '\n')
console.log('seed.sql written,', s.stories.length, 'stories')
