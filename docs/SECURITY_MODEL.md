# Security model

## Trust boundary

All canonical data lives in the browser. There is no server-side authorization.

## Data classes

| Class | Examples | Handling |
| --- | --- | --- |
| User facts | tasks, notes, habits, profile | localStorage workspace document |
| Inferred | analytics copy | Must not be labeled as AI fact |
| External preview | Google / teams UI | Not connected; no secrets |

## Share links

- Payload is visible to anyone with the URL (history, referrer, logs).
- Encoder is unicode-safe and rejects oversized tokens.
- Import writes only into the local workspace after an explicit click.

## Clipboard

- Off by default.
- When enabled, may read clipboard text. Do not treat this as safe for passwords.

## External actions

No payments, no outbound Google API, no email send except `mailto:` / WhatsApp deep links the user triggers.
