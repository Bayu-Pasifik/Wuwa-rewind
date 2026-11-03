# PRD — Cranellz: Wuthering Waves Story Archive

| | |
|---|---|
| Product | Cranellz, an unofficial fan archive of Wuthering Waves narrative content |
| Owner | pasifik.bayu19@gmail.com |
| Status | Draft v1, 3 Nov 2026 |
| Companion files | `STYLE.md` (visual + motion spec), `TASKS.md` (build plan), `seed.json` (initial data), `build_seed.py` (regenerates seed) |
| Game state covered by seed | Versions 1.0 to 3.7 (3.7 released 30 Sep 2026) |

## 1. Summary

Cranellz shows every Wuthering Waves story (main-story acts, segues, Tales, companion stories, side and exploration quests, event stories) as a worn VHS tape on an endless 3D shelf. One tape at a time turns out to face the viewer; opening it grows a sheet of paper into a detail page and then a long-form reader. All content is managed in a CMS so new stories can be added on each game version's launch day without code changes. Every story is written in two languages, **English (en)** and **Bahasa Indonesia (id)**, and readers switch between them.

The UI is a direct reuse of the "Leon Vasari VHS filmography shelf" concept, rebranded to Cranellz. The exact visual and motion spec lives in `STYLE.md`.

## 2. Goals and non-goals

### Goals
1. Present the full Wuthering Waves story in reading order in a single memorable interface.
2. Let editors publish a new story entry in under 5 minutes, including scheduling it for a version launch.
3. Serve every story in English and Indonesian, with a one-click language switch that keeps the reader's place.
4. Keep the shelf at 60 fps with 500+ entries.

### Non-goals (v1)
- Hosting game script transcripts or datamined text. Bodies are original summaries and write-ups.
- User accounts for readers, comments, ratings.
- Languages beyond en and id (the model allows more later).
- Mobile apps. The site is responsive web only.

## 3. Users

| User | Need | Primary surface |
|---|---|---|
| Reader (EN) | Catch up on the story, re-read a chapter before a new version | Shelf, detail, reader |
| Reader (ID) | Same, in Indonesian | Shelf, detail, reader with `?lang=id` |
| Editor | Add and update stories fast, upload art, schedule releases | `/admin` |
| Admin | Manage editors, categories, version groups, site settings | `/admin` |

## 4. Content scope

### 4.1 Categories (seeded, editable)

| Code | English | Indonesian | Seeded entries |
|---|---|---|---|
| MAIN | Main Story | Cerita Utama | Prologue + Chapters I to IV acts |
| SEGUE | Segue | Selingan | Overtures, afterstories, segues |
| TALE | Tales | Kisah | Tales quests (new type from 3.7) |
| COMP | Companion Story | Kisah Pendamping | 14 companion stories |
| SIDE | Side Quest | Misi Sampingan | 3 drafts |
| EXPL | Exploration Quest | Misi Eksplorasi | 5 drafts |
| EVNT | Event Story | Cerita Event | Collab and event stories |

### 4.2 Seed data (`seed.json`)

- **67 stories**: 59 published (main, segues, Tales, companions) and 8 drafts (side and exploration quests) left for editors to write.
- Order, titles, versions, regions and featured characters come from Game8's quest and version pages; each entry keeps its `source_url`.
- Synopses and summaries are original Cranellz text, written in both languages. Companion-story summaries are placeholders that editors must replace.
- `needs_review: true` on 15 entries whose version or details were inferred and should be checked in-game.
- Indonesian titles are fan translations (the game has no official Indonesian localisation).
- `original_title` (Chinese/Japanese client title) is null on all entries; editors fill it in.
- Default story on load: **Simulacrum of the Heart** (Ch. IV Act IV, 3.7), the latest main act.

## 5. Functional requirements

### 5.1 Public shelf (`/`)
| ID | Requirement |
|---|---|
| F1 | Render all published stories in `sort_key` order as an endless 3D shelf, exactly as specified in `STYLE.md` §3–§5. |
| F2 | Version tabs (ALL, 1.X, 2.X, 3.X, …) are generated from `version_groups` that contain published stories. Clicking a tab jumps to that group's first story. |
| F3 | A category filter replaces the original "CAREER" label. Filter state is in the URL (`?category=COMP`). |
| F4 | A language switch `EN / ID` sits in the top bar. Choice is stored in the URL (`?lang=id`) and `localStorage`; default comes from `site_settings.default_locale`, then the browser language (`id*` → id). |
| F5 | Caption shows title in the active language, the other-language title as the cobalt subtitle, and `CATEGORY · VER. X.Y · CHAPTER LABEL` as meta. |
| F6 | Deep links: `?story=<slug>` opens the shelf on that story; `/story/:slug` opens its detail sheet. |
| F7 | Inputs: click, arrows, keyboard (←/→/Enter/Esc), wheel, drag, touch scrub. |
| F8 | Stories with no art render a generated typographic tape (`STYLE.md` §6). |
| F9 | 0 stories in a filter → placeholder tape "NOTHING HERE YET / BELUM ADA"; 1 story → single tape, no looping. |

### 5.2 Detail sheet (`/story/:slug`)
| ID | Requirement |
|---|---|
| D1 | Paper sheet grows out of the cover; text rises line by line; poster bleeds in via the ink mask (`STYLE.md` §8). |
| D2 | Shows subtitle, title, meta, featured characters, synopsis, credit line, and "READ THE STORY / BACA CERITA" button, all in the active language. |
| D3 | If the active language's `body` is empty, the button reads "WRITE-UP COMING / SEGERA HADIR" and is disabled; if only the other language has a body, offer "READ IN ENGLISH" / "BACA DALAM BAHASA INDONESIA". |
| D4 | Close via button, Esc or browser Back reverses the sheet animation. |

### 5.3 Reader (`/story/:slug/read`)
| ID | Requirement |
|---|---|
| R1 | Long-form body rendered from TipTap JSON in the active language. |
| R2 | Supported nodes: paragraph, h2, h3, blockquote, image + caption, rule, **dialogue** (speaker + line), **choice** (list of options). |
| R3 | Switching language keeps the scroll position by matching the nearest heading or paragraph index. |
| R4 | Sticky header with back link, logo and reading progress; prev/next story links at the end. |

### 5.4 CMS (`/admin`)
| ID | Requirement |
|---|---|
| C1 | Magic-link sign-in; roles `admin` and `editor`. |
| C2 | Stories list with search (title in both languages, characters), filters (category, version group, status, needs_review), drag reorder writing fractional `sort_key`. |
| C3 | Story editor with **side-by-side EN / ID tabs** for title, synopsis and body. A completeness badge per language (title, synopsis, body). |
| C4 | Live preview of the tape and detail sheet using unsaved edits, with a language toggle. |
| C5 | Media library with locked-ratio crop (spine 142:840, cover 474:900) and multi-crop for sprite sheets. |
| C6 | Status: draft → scheduled (`publish_at`) → published. Scheduled stories go live automatically. |
| C7 | "Duplicate" action for fast new-release entry. |
| C8 | JSON import (upsert by slug, dry-run diff) and export. `seed.json` must import cleanly. |
| C9 | Categories, version groups and site settings are editable. |

## 6. Data model

All human-readable text fields are **localized objects** `{ "en": string|null, "id": string|null }`.

### `stories`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| slug | text unique | from English title |
| category | text → categories.code | |
| chapter_label | text null | e.g. `CH. IV · ACT IV` (language-neutral) |
| title | jsonb localized | required in `en`; `id` required to publish |
| original_title, original_title_lang | text null, `zh-Hans`/`ja` | |
| romanised_title | text null | |
| version | text | `3.7` |
| version_group | text → version_groups.label | `3.X` |
| region | text | |
| characters | text[] | |
| est_minutes | int null | |
| release_date | date | |
| synopsis | jsonb localized | ≤ 260 chars each |
| body | jsonb `{en: TipTapDoc|null, id: TipTapDoc|null}` | |
| spine_media_id, cover_media_id | uuid null → media | |
| sort_key | numeric | |
| status | enum draft / scheduled / published | |
| publish_at | timestamptz null | |
| needs_review | bool | |
| source_url | text null | shown to editors only |
| updated_by, updated_at | | |

### Other tables
- `categories(code, name jsonb, name_jp, sort)`
- `version_groups(label, label_jp, sort)`
- `versions(version, name, release_date)` — reference list for the editor's version picker
- `media(id, url, width, height, crop jsonb, alt jsonb localized, credit)`
- `site_settings` single row: `brand_latin`, `brand_cjk`, `top_right_label` (localized), `back_link_url`, `social_links`, `disclaimer` (localized), `default_story_slug`, `default_locale`, `locales`

### Publish rule
A story can be published only when `title.en`, `title.id`, `synopsis.en` and `synopsis.id` are present. `body` may be empty in either language.

## 7. Technical approach

| Layer | Choice |
|---|---|
| Front end | React 18 (JavaScript) + Vite + React Router |
| Styling | Tailwind CSS reading CSS-variable tokens from `STYLE.md` |
| 3D | CSS 3D transforms in one rAF loop; Three.js only for the optional grain shader |
| i18n | Content: localized fields. UI strings: `src/i18n/{en,id}.json` |
| Backend | Supabase (Postgres, Storage, Auth) behind an `api/` module |
| Fetching | TanStack Query; shelf list cached 5 min; bodies lazy-loaded |
| Rich text | TipTap (editor) → JSON → React renderer |
| SEO | Prerender `/story/:slug` per language (`/id/story/:slug` alternate with `hreflang`) |

Row Level Security: anonymous read where `status='published' or (status='scheduled' and publish_at <= now())`; writes for editor/admin only.

## 8. Non-functional requirements

| Area | Target |
|---|---|
| Performance | 60 fps shelf at 500 stories on a mid-range laptop; LCP < 2.5 s on 4G |
| Payload | Shelf list ≤ 150 KB gzipped at 500 stories (no bodies) |
| Accessibility | WCAG 2.2 AA; full keyboard use; `aria-live` caption; `lang` attributes per language |
| Reduced motion | Honours `prefers-reduced-motion` (`STYLE.md` §11) |
| Browsers | Last 2 versions of Chrome, Safari, Firefox, Edge; iOS 16+, Android 12+ |

## 9. Legal and content policy

- Footer and about page carry the disclaimer from `site_settings.disclaimer` in the active language.
- No game script text, no datamined content, no official logos. Official art may be uploaded only by editors who accept responsibility; the generated typographic tape is the default.
- `source_url` is for editor verification and is not shown publicly.

## 10. Success metrics (first 90 days)

- New version stories published within 24 h of each game update.
- ≥ 95 % of published stories have complete EN and ID titles and synopses.
- ≥ 30 % of sessions open at least one detail sheet.

## 11. Release plan

1. **M1 Shelf** — public shelf on static `seed.json`, bilingual captions.
2. **M2 Detail + reader** — sheet animation, ink reveal, reader.
3. **M3 CMS** — Supabase, admin, import of `seed.json`.
4. **M4 Polish** — SEO prerender, performance, accessibility audit.

## 12. Open questions

- Chinese logo line (`brand_cjk`) for "Cranellz": leave text-only until the owner supplies one.
- Should companion stories sit in story order or be grouped at the end of each version? Seed uses "after the version's main acts".
- Verify the 15 `needs_review` entries in-game before launch.
