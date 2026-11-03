# TASKS — Cranellz build plan

Work top to bottom. Each task lists what "done" means. References: `PRD.md` (what), `STYLE.md` (how it looks and moves), `seed.json` (data).

Legend: **[S]** small (< 2 h) · **[M]** medium (half day) · **[L]** large (1–2 days)

---

## M0 — Project setup

- [ ] **T0.1 [S] Scaffold** — Vite + React 18 (JS) + React Router + Tailwind. Folders: `src/shelf`, `src/detail`, `src/reader`, `src/admin`, `src/api`, `src/i18n`, `src/styles`.
  *Done:* `npm run dev` serves an empty paper-coloured page.
- [ ] **T0.2 [S] Tokens** — `src/styles/tokens.css` with every token from STYLE §1; Tailwind `theme.extend` reads them.
- [ ] **T0.3 [S] Fonts** — self-host Newsreader + Inter Tight (Latin + Latin-Ext WOFF2); Noto Sans JP/SC via Google Fonts with `display=swap`.
  *Done:* "Hati Laksana Bulan" and "灰の正午" both render in the right faces.
- [ ] **T0.4 [S] i18n** — `src/i18n/en.json`, `id.json` with every key from STYLE §3; `useLocale()` hook reading `?lang`, `localStorage`, `navigator.language`.
- [ ] **T0.5 [S] Data access** — `src/api/stories.js` with `listStories()`, `getStory(slug)`, `getSettings()`; M1 implementation reads `public/seed.json`.

## M1 — Shelf

- [ ] **T1.1 [M] Engine** — `shelfEngine.js`: rAF loop, spring (k 5.2 / 18 drag), loop normalising, `onActiveChange(index, dir)`. Pure JS, no React state per frame.
- [ ] **T1.2 [L] Tape pool** — 40 pooled `.tape` elements, virtual index binding, `copies = max(3, ceil(40/N))`, culling, placement and turning formulas from STYLE §5.4.
  *Done:* 59 published seed stories loop endlessly; ~13 visible at 1440px.
- [ ] **T1.3 [M] Faces** — art faces via crop math (PRD §6 media) and generated typographic tapes (STYLE §6) for stories without art. All 59 seed entries use the generated tape.
- [ ] **T1.4 [M] Inputs** — click, arrows, keyboard, wheel (160ms snap), drag (5px threshold, click suppression), touch scrub.
- [ ] **T1.5 [S] Hover lift + tilt** — per STYLE §5.4.
- [ ] **T1.6 [M] Caption** — masked 3-line caption with swap animation; bilingual title/subtitle; meta line.
- [ ] **T1.7 [M] Version tabs** — generated from data; sliding cobalt indicator; jump by shortest path.
- [ ] **T1.8 [M] Top bar** — logo fallback (no `brand_cjk`), language switch, category filter menu with clip reveal, URL sync (`?lang`, `?category`, `?story`).
- [ ] **T1.9 [S] Play ring, arrows, footer, grain layer.**
- [ ] **T1.10 [M] Custom cursor** — four states, fine pointers only.
- [ ] **T1.11 [S] Edge cases** — filter with 0 and 1 stories; start position from `?story` → `default_story_slug`.
  *M1 acceptance:* opens on *Simulacrum of the Heart*; switching EN→ID swaps the caption without moving the shelf; filtering to COMP shows 14 tapes looping.

## M2 — Detail sheet and reader

- [ ] **T2.1 [M] Detail layout** — STYLE §8 left column + poster SVG with ink mask.
- [ ] **T2.2 [M] Open/close animation** — WAAPI clip + rotate from the projected cover rect; text rise; ink bleed rAF; reverse on close; Esc and Back.
- [ ] **T2.3 [S] Routing** — `/story/:slug` opens shelf + sheet directly with reduced-motion timings.
- [ ] **T2.4 [M] Read button states** — read / write-up coming / read in other language (PRD D3).
- [ ] **T2.5 [L] Reader** — TipTap JSON renderer incl. dialogue and choice nodes; sticky header with progress; prev/next; paragraph reveals.
- [ ] **T2.6 [S] Language switch in reader** — keeps position by block index.
  *M2 acceptance:* every published seed story opens and reads in both languages.

## M3 — CMS

- [ ] **T3.1 [M] Supabase schema** — tables from PRD §6, enums, indexes on `sort_key`, `status`, `version_group`.
- [ ] **T3.2 [S] RLS** — public read rule incl. scheduled publish; editor/admin writes.
- [ ] **T3.3 [S] Swap data layer** — `src/api` to Supabase; shelf unchanged.
- [ ] **T3.4 [M] Import/export** — JSON upsert by slug with dry-run diff. *Done:* `seed.json` imports with 67 created, 0 errors; export round-trips byte-identical content fields.
- [ ] **T3.5 [S] Auth** — magic link, roles.
- [ ] **T3.6 [M] Stories list** — search both languages, filters incl. `needs_review`, drag reorder with fractional `sort_key`.
- [ ] **T3.7 [L] Story editor** — EN/ID tabs, completeness dots, publish validation (PRD §6 publish rule), TipTap with Dialogue/Choice/Part/Image tools, Duplicate action.
- [ ] **T3.8 [M] Live preview** — shelf at 60% scale + detail toggle + EN|ID toggle using unsaved data.
- [ ] **T3.9 [M] Media library** — upload, locked-ratio crop, multi-crop for sprite sheets, localized alt text.
- [ ] **T3.10 [S] Categories, version groups, site settings screens.**
  *M3 acceptance:* an editor creates "Chapter IV Act V" for 3.8 with EN+ID titles and synopses, schedules it, and it appears on the public shelf at `publish_at` with no deploy.

## M4 — Polish and launch

- [ ] **T4.1 [M] Responsive pass** — STYLE §10 at 375, 768, 1440, 1920.
- [ ] **T4.2 [S] Reduced motion** — STYLE §11.
- [ ] **T4.3 [M] Accessibility** — keyboard tab order (±6 tapes), focus trap in dialog, `lang` attrs, screen-reader pass in both languages.
- [ ] **T4.4 [M] Performance** — 500 synthetic stories at 60 fps; list payload ≤ 150 KB gz; preload 7 nearest images.
- [ ] **T4.5 [M] SEO** — prerender `/story/:slug` and `/id/story/:slug` with `hreflang`, OG image from cover.
- [ ] **T4.6 [S] Legal** — disclaimer in footer and `/about` in both languages.

## Content tasks (editors, parallel to M3–M4)

- [ ] **C1** Verify the 15 `needs_review` entries in-game (companion versions for Zhezhi, Camellya, Carlotta, Roccia, Brant, Zani; The Nethermancer's Requiem; all 8 drafts).
- [ ] **C2** Replace the 14 placeholder companion summaries with real spoiler-light write-ups in EN and ID.
- [ ] **C3** Write synopses and summaries for the 8 side/exploration drafts, then publish.
- [ ] **C4** Fill `original_title` + `original_title_lang` for all entries from the CN/JP client.
- [ ] **C5** Proofread Indonesian titles and text with a native speaker.
- [ ] **C6** Add art (or keep generated tapes) for at least the 10 newest stories.
- [ ] **C7** On each new game version: add version to `versions`, create the group if it is a new major version, duplicate entries, schedule for launch time.

## Definition of done (whole project)

- Shelf, detail and reader match STYLE.md with no opacity fades.
- All 59 seed stories readable in English and Indonesian.
- A new story can be published from `/admin` in under 5 minutes.
- Lighthouse ≥ 90 for Performance and Accessibility on `/` and `/story/:slug`.
