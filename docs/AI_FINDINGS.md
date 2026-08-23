# AI findings

**Treat every AI feature as guilty. Verdict: there is no AI feature. There is fake intelligence.**

## Why AI?

Nobody can answer. There is no model, no prompt, no eval, no router, no RAG, no structured output, no tool.

## Where the product pretends

| Surface | Looks like | Is |
| --- | --- | --- |
| Analytics title “Insights” + Brain icon | Model | Completion ratio (RT-029) |
| Task `@mention` | Smart assign | Hardcoded five people (RT-027) |
| Clipboard “Save this link?” | Assistant | Regex + 2s poll (RT-022) |
| Voice note | Transcription AI | Browser speech APIs (not inspected live; UA-1) |
| Productivity Score | Learned metric | `(done/n)*50 + (habitsToday/m)*50` |
| “Smart Task & Life Management” | Positioning | Template string (RT-016) |

Owner vision already rejected “AI product that invents peak hours.” The chrome did not get the memo.

## Chaos test (conceptual)

| Failure | What happens |
| --- | --- |
| Hallucination | N/A — heuristics only. The **score** still misleads. |
| Structured output break | N/A |
| Prompt injection | N/A in-model. Share/import injects **tasks** into the workspace (RT-007). |
| PII to vendor | No model vendor. Clipboard + share URL leak PII without a model (RT-006, RT-022). |
| Cost / latency spike | Fake Google adds 2s on purpose. |
| Provider outage | N/A |

## Evals

None. Cannot say the “insight” recommendation is useful. It is a string template.

## Do not add AI to compete

TickTick shipped AI voice split, MCP, and auto-categorization ([TickTick AI Voice Add](https://help.ticktick.com/articles/7444677039392555008), [What’s New](https://help.ticktick.com/articles/7082552170989486080)). Copying that while reminders do not fire is marketing debt.

If voice capture stays, keep it **deterministic browser STT** and persist audio in IndexedDB (P3 in owner backlog). Do not wrap it in “AI Mode.”
