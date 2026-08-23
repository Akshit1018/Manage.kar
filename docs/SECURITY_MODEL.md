# Security model

## Trust boundary

All canonical data lives in the browser. There is no server-side authorization.

## Data classes

| Class | Examples | Handling |
| --- | --- | --- |
| User facts | tasks, notes, habits, profile | localStorage workspace document |
| Inferred | counts copy | Must not be labeled as a model |
| External preview | Google backup stub | Not connected; no secrets |

## Share links

- New links are AES-GCM ciphertext (`enc1.`) plus a password the sender must share separately.
- The ciphertext sits in the URL (history, referrer, logs). The link does not expire and cannot be revoked without a server.
- Old plaintext tokens still decode.
- WhatsApp and email share **task titles in the message**, not the encrypted token.

## Clipboard

- Off by default.
- When enabled, may read clipboard text. Do not treat this as safe for passwords.

## External actions

No payments, no outbound Google API, no email send except `mailto:` / WhatsApp deep links the user triggers.
