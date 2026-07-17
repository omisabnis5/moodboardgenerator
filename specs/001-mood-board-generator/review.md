<!-- specs-gate: status=CLEAR -->
# Plan Review: Mood Board Generator (001)

Reviewed: spec.md, plan.md, prs.md, state.json (no constitution — defaults accepted).
**Result: CLEAR — no open blockers.** 0 blockers · 2 major · 5 minor · 3 nit. Majors are addressed by existing plan mitigations; recorded here as implementation watch-items.

## Completeness & traceability
- Every FR (1–14) maps to a task (T-1…T-7) and a PR (PR-1…PR-5). No orphan tasks; no FR without a home.
- All ACs (1–11) have a verification method. AC-6 (visual on-brief) is manual-only by nature — acceptable, backed by a metadata assertion (palette/label match).
- NFRs are addressed in design, not just listed (a11y semantics, keyless security, timeout/reliability). ✅
- PR decomposition: contracts-first, acyclic graph, valid topological order, each PR independently verifiable and leaves the app working. ✅

## Findings

### Blockers
_None._

### Major
- [x] **M1 — Cross-origin download (FR-13/AC-9).** Fetching the Pollinations image as a blob for download may be blocked by CORS, breaking downloads. **Fix (already in plan §8/T-5):** attempt `fetch`→blob→objectURL; on failure fall back to `<a href={imageUrl} download target="_blank">`. Implementer must include the fallback and E2E must assert a download *or* new-tab open. Tracked as implementation requirement.
- [x] **M2 — E2E determinism depends on intercepting image loads, not just fetch.** Boards load via `<img src>`, so Playwright must `page.route('**image.pollinations.ai/**', fulfill fixture)` covering image requests (not only XHR). **Fix (in plan §6):** route matches all request types; fixture `e2e/fixtures/board.jpg` served. Confirmed approach valid; call out in PR-5.

### Minor
- **m1 — Pollinations 429/5xx/slow:** rate-limit or upstream errors must surface as the Error state + Retry (FR-11), and the 45s `AbortController` timeout must actually abort the `<img>`/fetch. Ensure per-board error tiles don't fail the whole batch.
- **m2 — Image `alt` text:** each board `<img>` needs descriptive alt (e.g. "Traditional pastel kitchen mood board 1") for NFR-Accessibility; add to PR-4/PR-5.
- **m3 — `aria-live` for generation status:** loading/success/error transitions should be announced (polite live region) — add in PR-5 polish.
- **m4 — Distinctness assertion:** `generate.test.ts` should assert 4 *distinct seeds AND distinct URLs*; E2E should assert 4 tiles with differing `src` (seed differs) even though the fixture image is identical under interception (assert on the requested URL/seed, not pixels).
- **m5 — Selection summary ordering:** spec shows "Traditional · Pastels · Kitchen"; pick one canonical order (Room · Style · Palette) and keep UI + label consistent.

### Nit
- **n1 — Neutral branding:** define a small design-token set (font, accent) so PR-6 polish is consistent.
- **n2 — `nologo=true` + `model=flux`:** keep provider params in one place (`PollinationsProvider`) so they're swappable/testable.
- **n3 — `console.info` observability:** ensure no PII and gate behind a tiny logger to avoid noise in tests.

## Regression & sequencing
- Shared contract (PR-2) lands before consumers; unit tests lock counts/labels/prompt/board-count so later UI PRs can't silently drift signatures. ✅
- Each PR keeps `build` + tests green (qa-verifier per PR). No DB/migrations. Rollback = revert commit / redeploy. ✅
- Environment note: `gh` absent → push/PR/merge steps are manual; does not affect plan validity.

## Verdict
Plan is coherent, traceable, and verifiable. Majors have concrete mitigations already in the plan and are tracked as implementation watch-items rather than blockers. **Gate: CLEAR — proceed to execute.**

---

## Change request v2 review (2026-07-17) — PR-6
Reviewed the CR-1..4 additions to spec/plan/prs. **Gate remains CLEAR — 0 blockers.**

- **Traceability:** CR-1→FR-15, CR-2→FR-9/NFR-Reliability, CR-3→FR-8, CR-4→FR-16; each has an AC (12–15) and a task (T-8..T-12) in PR-6. ✅
- **Reliability approach (m1 follow-up):** the earlier staggered-start model reduced but did not
  eliminate partial failures; the bounded-concurrency queue (in-flight ≤ 2) + exponential
  backoff directly targets the observed 403/ORB rate-limiting. Sound. Watch-item: keep the
  per-image timeout so a stuck request can't hold a slot forever.
- **Regression (major watch, not blocker):** the `useMoodboards` rewrite is the highest-risk
  change; all prior generation ACs (4,5,7,8,9) plus selection ACs must stay green. The plan
  mandates re-running the full suite. The `__MB_CONFIG__` override keeps the error/retry E2E
  fast without weakening production defaults — good practice, no security surface (read-only
  client tuning, no secrets).
- **Layout:** two-pane must not alter radiogroup semantics or the sticky Generate affordance;
  covered by keeping AC-1,2,3,10 in the regression set.

**Gate: CLEAR — proceed with PR-6.**
