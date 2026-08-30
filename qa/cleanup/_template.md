# cleanup-YYYY-MM-DD

Target:

Status: review only. The overnight agent must not execute these steps.

Human decision per item: [ ] run  [ ] skip  [ ] escalate

## 1. kind id= — title

Surface: pwa-localStorage | flutter-postgres
Created:
Proposed (do not run until a human checks the SELECT / UI):

```
SELECT id, title, "createdAt" FROM "Task" WHERE title LIKE 'qa-%';
```
