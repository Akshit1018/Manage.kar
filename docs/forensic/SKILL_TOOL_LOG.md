# Skill / tool log

Rule: do not pretend a tool was used. If a specialized skill applied and was not read, that is a miss.

| Skill / tool | Purpose | Used? | Why | Result |
| --- | --- | --- | --- | --- |
| `using-superpowers` | Find and follow skills before working | Partial | Mid-handoff continuation; skill was read in the earlier forensic session, not re-opened this close-out turn | Workflow already in motion (reconstruct → documents → PR) |
| `parallel-web-search` / `parallel-cli` | Default research CLI | **No (failed)** | `parallel-cli` was not on PATH | Did not invent Parallel results |
| `firecrawl-search` / Firecrawl CLI | Search + page extract | **No (failed)** | `firecrawl` / `npx firecrawl` not usable. A leftover `npx firecrawl-cli login --browser` process was already running; it was **not** waited on and produced no audit evidence | WebSearch + cited URLs only |
| `parallel-web-extract` | Fetch competitor pages | No | Blocked on the same CLI gap | Competitor facts limited to snippets already retrieved |
| `parallel-deep-research` | Exhaustive report | No | User asked for forensic intelligence, not the “deep research” trigger phrase; CLI also missing | — |
| WebSearch (Cursor) | Current competitor / OSS facts | **Yes** (prior turn) | Fallback after Parallel/Firecrawl failed | TickTick / Todoist / Things / Super Productivity / Cairn URLs used in the pack |
| citation-standards | Cite only search-output URLs | **Yes** | Required for competitor claims | Inline links + Sources blocks; no guessed URLs |
| Playwright MCP | Live journeys | **Yes** | Experience step | Dirty-profile session at `http://127.0.0.1:3000`; desktop + mobile PNGs |
| `control-ui` | Local UI harness | Partial | Playwright MCP used instead of writing a new harness | Same evidence |
| `dispatching-parallel-agents` | Independent recon | **Yes** (prior turn) | Code archaeology vs research | Maps fed FEATURE_TRUTH_MAP / journeys |
| `brainstorming` | Creative feature work | No | Inspection only; no product invention | — |
| `writing-plans` / `executing-plans` | Multi-step implementation | No | This branch is documents | — |
| `verification-before-completion` | Do not claim done without a command | **Yes** | `curl` `/` → 200; `ls` evidence PNGs; `git status` | Server up; PNGs on disk |
| `check-compiler-errors` | `tsc` | No this turn | Docs-only branch; last known `tsc --noEmit` clean was on remediations | Not re-claimed |
| `pnpm test` | 36 unit tests | No this turn | Not a code change | Not re-claimed |
| `react-doctor` / `improve-react` | React diagnostics | No | Not a React implementation turn | — |
| `systematic-debugging` | Runtime bug | No | Not fixing a failing test | — |
| `review-and-ship` / `new-branch-and-pr` | PR workflow | Partial | Cloud rules require `ManagePullRequest`; branch already `cursor/forensic-intelligence-e2f4` | Used after documents landed |
| `fix-ci` / `loop-on-ci` | PR checks | No | No product CI change expected | — |
| `get-pr-comments` | Review comments | No | New PR | — |
| `subscribe` / cursor-subscriptions | Wait on CI | No | Docs PR | — |
| cursor-cloud MCP | Run identity | No | Not needed to reconstruct the app | — |
| Clay / Apollo / Gmail / Calendar | Unrelated | No | Wrong domain | — |
| Higgsfield / generate-image | Images | No | Evidence is screenshots, not generated art | — |
| Confidence-docs / flags | Unrelated | No | — | — |
| Static analyzers / security scanners | Semgrep etc. | No | None invoked | Security claims are source-trace only |
| ESLint / React Doctor CLI | Lint | No this turn | — | — |

## Expert-methodology note

Matt Pocock–style exhaustive TypeScript switches already exist as a workspace rule. They were not the audit object. No expert skill was cargo-culted into a rewrite recommendation.

Super Productivity and Cairn were treated as **reference implementations**, not as “replace the repo” orders. Third pass rejects a same-week IndexedDB migration as an overreaction unless voice or scale forces it.
