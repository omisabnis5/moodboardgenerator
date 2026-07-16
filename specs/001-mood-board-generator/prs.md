# Pull Request Plan: Mood Board Generator

- **Spec ID:** 001-mood-board-generator
- **Default branch:** main
- **Ordering principle:** contracts (types/data/logic) land first so UI PRs build against a stable interface; separate concerns (scaffold → shared core → selection UI → generation UI → E2E/polish). Client-only project, so all PRs are `fe`/`shared` — separation is by module boundary, not by tier.

## Dependency graph
```
PR-1 (scaffold) ──> PR-2 (shared core: types/data/lib) ──> PR-3 (selection UI) ──┐
                                                       └──> PR-4 (generation UI) ─┴─> PR-5 (E2E + polish)
```
PR-4 depends on PR-2 (core) and PR-3 (selection panel provides the current selection). PR-5 depends on PR-3 + PR-4 (full flow exists to test).

## Pull requests

### PR-1: Project scaffold & tooling
- **Branch:** `feat/001-01-scaffold`
- **Layer:** shared/infra
- **Depends on:** none
- **Scope (in):** Vite + React + TypeScript app; ESLint + tsconfig; Vitest config + `test/setup.ts`; Playwright config (`webServer` on port 5173) + deps; `.gitignore`; npm scripts (`dev`, `build`, `preview`, `test:unit`, `test:e2e`, `lint`); minimal `App.tsx` shell that renders a title.
- **Scope (out):** any feature logic or UI.
- **Traces to:** NFR-Performance, NFR-Compatibility (build/test infra).
- **Verification:** test suite — `npm run build` succeeds, `npm run test:unit` runs (0 tests OK), `npm run lint` clean; Playwright smoke that the shell page loads.
- **Regression watch:** none (first PR).
- **Definition of done:** app builds and dev-serves a shell; tooling green.

### PR-2: Domain model, option data & generation core
- **Branch:** `feat/001-02-core`
- **Layer:** shared
- **Depends on:** PR-1
- **Scope (in):** `types.ts` (RoomType/Style/ColorPalette/ParameterOption/BoardResult/GenerateRequest); `data/options.ts` (3 option arrays + `PALETTE_HEX`); `lib/prompt.ts` (`buildPrompt`); `lib/imageProvider.ts` (`ImageProvider` + `PollinationsProvider`); `lib/generate.ts` (`generateBoards` — 4 seeds + variation hints); unit tests `options/prompt/generate.test.ts`.
- **Scope (out):** React components/hooks; download; styling.
- **Traces to:** FR-2,3,4,7,8,14; §8 data contract; AC-1,5,6; NFR-Security (whitelisted params).
- **Verification:** test suite — `npm run test:unit` (option counts 8/8/6 + labels; palette hex present; prompt contains selections; generate returns 4 distinct-seed/distinct-URL boards).
- **Regression watch:** this PR *is* the contract; lock it with tests so later PRs don't drift signatures.
- **Definition of done:** AC-1 (data portion), AC-5/AC-6 (logic portion) unit-verified; exported API stable.

### PR-3: Selection UI (option groups + palette swatches)
- **Branch:** `feat/001-03-selection-ui`
- **Layer:** fe
- **Depends on:** PR-2
- **Scope (in):** `OptionCard`, `OptionGroup` (radiogroup, keyboard + ARIA), `PaletteSwatches`, `SelectionPanel`, single-select state, selection summary, disabled-reason wiring for Generate (button rendered but generation handler stubbed/no-op here); component/unit test for selection reducer.
- **Scope (out):** actual image generation, results grid, download.
- **Traces to:** FR-1,5,6; AC-1 (render), AC-2, AC-3, AC-10; NFR-Accessibility.
- **Verification:** Playwright — options render (8/8/6), single-select per group, Generate disabled until all three, keyboard nav + `aria-checked`; unit test on selection logic.
- **Regression watch:** consumes PR-2 exports without changing them.
- **Definition of done:** AC-1,2,3,10 pass; Generate enables correctly (no-op action).

### PR-4: Generation flow, results grid & download
- **Branch:** `feat/001-04-generation-ui`
- **Layer:** fe
- **Depends on:** PR-2, PR-3
- **Scope (in):** `useMoodboards` hook (idle/ready/loading/success/error + stale); wire Generate to `generateBoards`; `BoardGrid`/`BoardCard` with loading skeletons, per-board image, per-board error tile + Retry, batch error + Retry, per-board download; lock Generate during batch; mark results stale on selection change and replace on regenerate.
- **Scope (out):** final visual polish, full E2E matrix (basic wiring tests only here).
- **Traces to:** FR-7,9,10,11,12,13; AC-4,5,7,8,9; NFR-Reliability.
- **Verification:** Playwright (with image interception) — Generate→loading→4 boards; forced error→Retry; change→stale→regenerate replaces; download emits a file.
- **Regression watch:** must not break PR-3 selection behavior; Generate stays disabled until complete.
- **Definition of done:** AC-4,5,7,8,9 pass under intercepted provider.

### PR-5: E2E suite, accessibility & responsive polish
- **Branch:** `feat/001-05-e2e-polish`
- **Layer:** fe/shared
- **Depends on:** PR-3, PR-4
- **Scope (in):** consolidated Playwright `moodboard.spec.ts` covering AC-1,2,4,5,7,8,9,10 with fixture interception; `e2e/fixtures/board.jpg`; responsive layout (2×2 → 1 col), focus styles, contrast/ARIA polish, neutral branding, selection summary; live-generation smoke (manual/optional) for AC-6.
- **Scope (out):** new features.
- **Traces to:** all ACs (verification), NFR-Accessibility, NFR-Compatibility.
- **Verification:** full `npm run test:e2e` green; manual live check for AC-6.
- **Regression watch:** whole flow stays green; no core signature changes.
- **Definition of done:** all automated ACs pass; app polished and responsive.

## Execution order
1. PR-1 (scaffold)
2. PR-2 (shared core)
3. PR-3 (selection UI)
4. PR-4 (generation UI)
5. PR-5 (E2E + polish)

> `/specs:execute` walks this list top to bottom, skipping PRs whose dependencies are not yet merged, and records status in `state.json`. NOTE: `gh` is not installed in this environment, so the push/open-PR/merge steps run manually (commit locally / push to origin) rather than via `gh`.
