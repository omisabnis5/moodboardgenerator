# Implementation Plan: Mood Board Generator

- **Spec ID:** 001-mood-board-generator
- **Status:** draft
- **Constitution checked:** no constitution present — plan adopts sensible defaults (documented below); recommend ratifying later via `/specs:constitution`. No deviations to justify.

## 1. Approach
Build a **client-only React + Vite + TypeScript** single-page app. The three predefined option lists drive a selection UI (three single-select radiogroups). When all three are chosen, Generate builds four prompts (four distinct seeds + light variation phrasing) and requests four photoreal images from the **keyless Pollinations.ai** endpoint directly from the browser. Results render in a responsive 2×2 grid with per-board loading skeletons, error tiles + Retry, and per-board download. No backend, no secrets, no database — the provider is abstracted behind an `ImageProvider` interface so a keyed provider could be swapped in later (behind a proxy at that point).

The core (types, option data, palette hex, prompt builder, provider, batch orchestration) is a pure, unit-testable module landed early as a stable contract; the UI builds on it. Playwright E2E stubs the image requests with a local fixture for deterministic, offline runs.

## 2. Architecture impact
New project — proposed structure:

```
index.html, package.json, vite.config.ts, tsconfig*.json, .eslintrc, .gitignore
vitest.config.ts, playwright.config.ts
src/
  main.tsx, App.tsx, index.css, App.css
  types.ts                      # RoomType, Style, ColorPalette, ParameterOption<T>, BoardResult, GenerateRequest
  data/options.ts               # ROOM_TYPE_OPTIONS, STYLE_OPTIONS, COLOR_PALETTE_OPTIONS, PALETTE_HEX
  lib/prompt.ts                 # buildPrompt(request): string  (pure)
  lib/imageProvider.ts          # ImageProvider interface + PollinationsProvider
  lib/generate.ts               # generateBoards(selection, provider): BoardResult[]  (seeds + variation hints)
  hooks/useMoodboards.ts        # state machine: idle|ready|loading|success|error + stale flag
  components/
    SelectionPanel.tsx, OptionGroup.tsx, OptionCard.tsx, PaletteSwatches.tsx
    GenerateBar.tsx, BoardGrid.tsx, BoardCard.tsx
  test/
    setup.ts
    options.test.ts, prompt.test.ts, generate.test.ts, selection.test.ts   # vitest (unit)
e2e/
  moodboard.spec.ts             # Playwright (intercepts image.pollinations.ai → fixture)
  fixtures/board.jpg
```

- **Layers:** all `fe`/`shared` (no `be`/`db`/`infra`). `shared` = types/data/lib (contract + logic); `fe` = React components/hooks/styles.
- **Data model:** union types + `ParameterOption<T>`; `PALETTE_HEX: Record<ColorPalette, string[]>`; `BoardResult { id; seed; imageUrl; label; status }`.
- **API surface:** none (direct browser GET to provider URL).
- **Cross-cutting:** no auth/config/flags. Single strings module (option labels come from data) for later i18n.

## 3. Constitution & NFR compliance
- **Performance:** Vite build, code-light SPA; selection feedback is local state (<100ms). Generation shows skeletons immediately; 45s per-image timeout via `AbortController`.
- **Accessibility:** OptionGroup = `role="radiogroup"`, OptionCard = `role="radio"` with `aria-checked`, roving tabindex + arrow-key selection; Generate is a real `<button disabled>` with `aria-describedby` reason; selected state uses check icon + border, not color alone; contrast ≥ 4.5:1. Verified by Playwright a11y assertions.
- **Security:** keyless provider → no secret in bundle/repo; parameters constrained to union `value`s before prompt composition (no free text). CI/grep check asserts no key strings.
- **Reliability:** each image request wrapped in try/catch + timeout; a single failed board renders an error tile with Retry without failing the batch; provider swappable.
- **Observability:** `console.info` on batch start/success/failure with the three selected values (no PII).
- **Compatibility:** modern evergreen browsers; responsive grid reflows to 1 column < 640px.
- **i18n:** English v1; labels centralized in `data/options.ts`; deferred full localization.

## 4. Technical decisions
- **Vite + React + TS** — matches the provided TS types; fast, static output. Alternatives: Next.js (rejected — no backend needed so its server adds nothing); plain JS (rejected — loses the typed option model).
- **Pollinations.ai, keyless, client-side** — chosen because it is free, requires no account, returns photoreal images, and supports `seed` for variation. Abstracted behind `ImageProvider` for swap-out.
- **Distinct boards via 4 fixed seeds + variation phrases** — deterministic, testable, guarantees FR-8 without four identical URLs.
- **Vitest** for unit (pairs with Vite) + **Playwright** for E2E with **request interception** (offline determinism) plus one live smoke check.
- **Per-board download** via `fetch → blob → object URL → <a download>` (no server).

## 5. Work breakdown (pre-split)

| Task | Layer | Traces to | Notes |
|------|-------|-----------|-------|
| T-1 Scaffold Vite+React+TS, ESLint, Vitest, Playwright configs, base app shell, `.gitignore` | shared/infra | NFR-Perf, NFR-Compat | `npm create vite`, wire test tooling; app renders a shell |
| T-2 Domain types + `data/options.ts` (3 option lists + `PALETTE_HEX`) + unit tests | shared | FR-2,3,4,14; AC-1 | Source of truth for choices + palette hex |
| T-3 `prompt.ts` (buildPrompt) + `imageProvider.ts` (interface + PollinationsProvider) + `generate.ts` (4 seeds/variation) + unit tests | shared | FR-7,8,14; AC-5,6; §8 contract | Pure logic; provider builds the URL |
| T-4 Selection UI: `OptionGroup`/`OptionCard` radiogroups, `PaletteSwatches`, `SelectionPanel`, single-select, disabled-reason | fe | FR-1,5,6; AC-1,2,3,10 | Keyboard + ARIA |
| T-5 Generation flow: `useMoodboards` state machine, `GenerateBar`, `BoardGrid`/`BoardCard` (loading/success/error/stale + Retry + download) | fe | FR-7,9,10,11,12,13; AC-4,5,7,8,9 | Locks Generate during batch; stale on change |
| T-6 Styling/responsive/a11y polish, neutral branding, selection summary | fe | NFR-A11y, NFR-Compat, FR-10 | 2×2 grid → 1 col on mobile |
| T-7 Playwright E2E with image interception + fixture; full-flow + error + download + keyboard specs | shared | AC-1,2,4,5,7,8,9,10 | Deterministic offline; one live smoke |

## 6. Verification strategy
- **Unit (Vitest, `npm run test:unit`)**: `options.test.ts` (counts 8/8/6, exact labels/values, every palette has hex — AC-1); `prompt.test.ts` (prompt contains room/style/palette + only whitelisted values — AC-6, security); `generate.test.ts` (returns exactly 4, distinct seeds, distinct URLs — FR-8/AC-5); `selection.test.ts` (single-select reducer, Generate-enabled predicate — AC-2,3).
- **E2E (Playwright, `npm run test:e2e`)**: app started with `npm run dev` (Vite, port **5173**; `webServer` in `playwright.config.ts`). Image requests to `**image.pollinations.ai/**` are **intercepted and fulfilled with `e2e/fixtures/board.jpg`** for determinism. Flows: render options (AC-1), disabled→enabled Generate (AC-2), single-select (AC-3), Generate→loading→4 boards (AC-4/5), forced provider error→error tile+Retry (AC-7), change selection→stale→regenerate replaces (AC-8), download a board (AC-9), keyboard-only select + ARIA state (AC-10).
- **Manual/live check**: run Generate against the real Pollinations endpoint once (Kitchen+Traditional+Pastels) and eyeball 4 on-brief boards (AC-6).
- **Security check**: grep bundle/repo for key-like strings (none expected — keyless).

## 7. Regression surface
- New project → minimal regression risk; primary risk is **later PRs breaking the shared contract** from T-2/T-3.
- **Shared code touched by multiple PRs:** `types.ts`, `data/options.ts`, `lib/*`. Guard: land them first (PR-2) with unit tests that lock counts/labels/prompt shape/board count; later UI PRs consume without modifying signatures. If a signature must change, update tests in the same PR.
- **App-stays-working invariant:** each PR leaves `npm run dev`, `npm run build`, and existing tests green (checked by qa-verifier each PR).
- No existing users/data/APIs to break.

## 8. Rollout & risk
- Sequencing: scaffold → core contract → UI (selection, then generation) → E2E/polish. No migrations.
- **Risk:** Pollinations latency/availability at runtime → mitigated by timeout + Error/Retry state and provider abstraction; E2E doesn't depend on it (intercepted).
- **Risk:** CORS on client-side image download (`fetch` of cross-origin image for blob) → mitigate by trying `fetch`+blob and falling back to opening the image URL / `<a download href=url>` if blocked; covered in T-5.
- Rollback: static bundle — revert commit / redeploy previous build. No stateful changes.
