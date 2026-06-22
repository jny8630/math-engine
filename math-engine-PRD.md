Here's the synthesized PRD, written as a clean, buildable brief for Claude Code + Fable 5.

---

# Product Requirements Document
## Math Muscle Memory Engine — v3.0 (Canonical)

**Author:** Executive Sponsor / Product Lead
**Date:** June 2026
**Target User:** Beatrix, 13, ISEE prep, independent summer study
**Stakeholder:** Father / Executive Sponsor, 6-hour transatlantic timezone offset

---

## 1. Vision

Beatrix doesn't need another quiz app. She needs a precision instrument that builds calculation speed through deliberate repetition, shows her dad exactly where she's struggling, and gives her tutor a ready-made briefing every Tuesday — without any of them manually reviewing raw data.

The application is a **10-minute sprint engine** with smart error tagging, a human accountability loop, and a pedagogical "prove it from memory" mechanic. It should feel encouraging and personal, not clinical.

---

## 2. What This Is Not

- Not a passive quiz bank
- Not a complex AI system requiring a backend server or database
- Not fully automated — the father is an intentional part of the loop
- Not multiple-choice-only (but defaults to it for speed and test-familiarity)

---

## 3. Core User Stories

| Who | Needs | So That |
|---|---|---|
| Beatrix | A fast, personalized drill session she can complete in 10 minutes | She builds calculation fluency without dread |
| Beatrix | To flag problems she's stuck on | She doesn't spiral or rage-quit |
| Dad | A morning dashboard showing yesterday's sprint results | He can send targeted encouragement or help |
| Tutor | A weekly auto-generated summary of struggle areas | Sessions are targeted, not diagnostic |

---

## 4. Functional Requirements

### A. The 10-Minute Sprint

- Countdown timer, prominently displayed
- Problems served one at a time
- **Default format: multiple-choice (4 options)** — mirrors ISEE format, reduces friction
- Track: problems attempted, problems correct, problems flagged
- Session ends when timer hits zero OR student taps "End Sprint"
- Sprint result summary displayed immediately at end

### B. Problem Mix (Per Sprint)

- **80% rapid-fire numerics:** fractions, decimals, negative integers, basic algebra, percent calculations
- **20% contextual word problems** using Beatrix's interest domains (see Section 6)
- Problems tagged with hidden metadata (see Section 5A)

### C. The "Prove It" Pedagogical Loop

When an answer is wrong:

1. **Reveal:** Show correct answer + step-by-step solution walkthrough
2. **Wipe:** Student taps "Got it" — explanation disappears entirely
3. **Retry:** Same problem served again, blank. Student must answer correctly from memory before moving on
4. **Lifeline:** If wrong again on retry, a **"Send for Help"** button appears. Tapping it flags the problem for dad's dashboard and queues it in the weekly tutor report. Student then advances — no permanent blocks.

> *Design note: "Send for Help" should feel like a reasonable, non-shameful action. Copy suggestion: "Flag this one for Dad 👋"*

### D. Dad's Morning Dashboard

- Accessible via the same GitHub Pages URL
- Shows (per day and per week):
  - Sprints completed
  - Problems attempted / correct / flagged
  - Concept tags where errors clustered (e.g., "3 errors tagged #fractions this week")
  - List of flagged "Send for Help" problems with full problem text

### E. Tuesday Tutor Report

- Auto-generated every Tuesday (or on-demand via button)
- Natural language summary, not raw data
- Format:
  > *"Beatrix completed 9 sprints this week. Speed is improving — she averaged 6 problems per sprint vs. 4 last week. She flagged 3 problems for help, all involving fraction denominators above 12. Recommend reviewing denominator alignment in Tuesday's session."*
- Exportable as PDF or printable view

### F. Concept Tagging (Background Analytics)

Every problem carries hidden metadata tags. No millisecond latency tracking (unnecessary complexity). Instead:

- Tag each problem with 1–2 concept labels: `#fractions`, `#decimals`, `#negative-integers`, `#percent`, `#word-problem`, `#algebra`, plus sub-tags like `#large-denominators`, `#multi-step`
- Log wrong answers by tag
- Surface "Struggle Areas" when 3+ errors share a tag within a week
- This is what populates the tutor report and dad's dashboard — no manual analysis required

---

## 5. Personalization

### Interest Matrix — Word Problem Domains

Problems in the 20% contextual bucket draw from these domains (rotate randomly):

| Domain | Core Math Focus |
|---|---|
| Thrift / resale clothing | Markup %, unit pricing, profit margin |
| Custom sewing / garment business | Material yield, linear constraints, cost per unit |
| Sailing / navigation | Rate × time × distance, ratio, % velocity change |
| Music streaming / artists | Fractions of runtime, royalty %, compounding |

Word problems should use Beatrix's name naturally. Example:
> *"Beatrix finds a vintage jacket priced at $18. She repairs it and sells it with a 35% markup. What is her selling price?"*

---

## 6. Data & Sync

- **All data stored client-side** (localStorage / IndexedDB)
- **Single-button GitHub sync** pushes state JSON to a private branch — no server required
- Dad accesses dashboard at the same static GitHub Pages URL
- Data persists across devices via the sync mechanism
- **No user accounts, no passwords** — the GitHub Pages URL is the access control

---

## 7. Streak & Motivation System

- Daily streak counter (consecutive days with ≥1 completed sprint)
- Milestone badges stored locally: Bronze (3-day streak), Silver (7-day), Gold (14-day)
- Personalized micro-prompts when a sprint ends or a milestone is hit:
  > *"That's 6 days in a row, Beatrix. Seriously impressive. Three more problems?"*

---

## 8. Out of Scope (This Build)

- Millisecond-level latency tracking
- Native mobile app
- LLM-generated problems (static templates are sufficient for v1)
- Any backend server, database, or auth system
- SMS/email alerts (flagged problems visible in dashboard is sufficient)

---

## 9. Open Questions for Fable 5 Before Build

**Fable should request answers to these before writing code:**

1. **Problem library:** Should Fable generate a fixed bank of ~200 tagged problems at build time, or write a programmatic generator that creates problems dynamically from templates? (Recommendation: generator, but needs sign-off)

2. **GitHub sync scope:** Is there an existing private repo to push data to, or should Fable scaffold one? What's the repo name?

3. **Tutor report delivery:** Print-friendly page within the app, or a downloadable PDF? Or both?

4. **Interest matrix weighting:** Should all four word-problem domains appear equally, or should sailing and clothing appear more frequently?

5. **Dashboard access:** Should dad's dashboard be a separate view/tab within the same app, or a separate URL path?

---

## 10. Success Criteria

The build is successful when:

- Beatrix can complete a 10-minute sprint on iPad or laptop with zero setup
- Dad can see yesterday's results and flagged problems within 60 seconds of opening the URL
- The Tuesday tutor report requires zero manual work to produce
- The app works fully offline after first load

---

**Handoff instruction for Fable 5:** Read this PRD top to bottom. Identify any ambiguities, list your clarifying questions, propose your implementation plan with phases, then await confirmation before writing code.