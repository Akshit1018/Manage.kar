# Green Team tasks

Base: post-remediation + forensic pack. No backend. No IndexedDB rewrite. No fake Google.

| ID | Problem | Class | Status |
| --- | --- | --- | --- |
| G001 | Habit frequency / custom days unused | VERIFIED | TESTED |
| G002 | `reminderTime` unused; no clock | VERIFIED | TESTED |
| G003 | `this week` = +3 days; unknown → today | VERIFIED | TESTED |
| G004 | `persist` does not notify; quota unguarded | VERIFIED | TESTED |
| G005 | Dirty slogan dates stay on disk | VERIFIED | TESTED |
| G006 | Mobile hides Share / tools | VERIFIED | TESTED (390px: Export + Goals/Share/Counts visible) |
| G007 | Home is counts, not today | VERIFIED | TESTED (Today heading; Mon habit absent on Sunday) |
| G008 | Counts “week” + static advice | VERIFIED | TESTED (All items; no 9–11 AM block) |
| G009 | WhatsApp plaintext vs enc1 copy | VERIFIED | TESTED (WhatsApp (plain text) + export default) |
| G010 | Share page “anyone with URL” after unlock | VERIFIED | IMPLEMENTED |
| G011 | SW cache-first stale `/` | VERIFIED | IMPLEMENTED |
| G012 | FAB RAM focus + blob voice | VERIFIED | IMPLEMENTED |
| G013 | Goals cannot delete/complete | VERIFIED | IMPLEMENTED |
| G014 | Search/view not in URL | VERIFIED | TESTED (`?view=habits`) |
| G015 | Stale README / SECURITY_MODEL / PRODUCT_GRAPH | VERIFIED | IMPLEMENTED |
| G016 | Checklist hidden on cards | VERIFIED | IMPLEMENTED |
| — | IndexedDB this week | REJECTED | — |
| — | TickTick calendar clone | REJECTED | — |
| — | Live Google OAuth | REJECTED | — |
