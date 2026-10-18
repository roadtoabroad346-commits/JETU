# Phase 00–06 preservation checkpoint — 2026-10-18

This checkpoint preserves the complete repository state through Phase 06. It is a
backup of the work and evidence, not a claim that every planned feature or phase is
finished. The phase statuses remain those recorded in `docs/PHASE_TRACKER.md`:
Phases 01–03 UNVERIFIED, Phase 04 PARTIAL, Phase 05 VERIFIED for its local gate,
and Phase 06 PARTIAL. Phase 07 has not been started.

## Preserved locations

- Working repository: `/workspace/JETU`.
- Full workspace copy: `/workspace/JETU_PHASE_00_06_PRESERVED`. The copy includes
  the Git directory and local ignored work/build/dependency artifacts for a full
  local snapshot. Use the working repository for continued development.
- GitHub repository: `roadtoabroad346-commits/JETU`. The preservation checkpoint
  is on `main`, `codex/phase06-landing`, and the annotated tag
  `phase-00-06-preserved-2026-10-18`.

The GitHub checkpoint includes the full versioned history, original nested `jetu/`
upload, user-provided pitch PDF and extracted context, master prompt, phase docs,
source, brand assets, tests, Supabase migrations/policies and evidence through
Phase 06. Generated `node_modules`, `.next`, Playwright output and `work/` are
present only in the workspace copy; Git excludes those rebuildable or intermediate
files. No `.env.local` or other untracked credential file existed at preservation
time. `.env.example` is versioned. No remote database or app deployment occurred.

The Phase 06 implementation commit is `29a5d08`. The preservation commit adds
this inventory and corrects the tracker to the final measured Lighthouse values;
it makes no application or database change. Integrity was checked by comparing
the copied tree with the working repository, matching Git HEAD, and reading back
the GitHub refs. To run the versioned snapshot on a computer, clone/download
GitHub `main` and follow `README.md`.
