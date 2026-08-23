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
- New links may include a client-side `expiresAt`. This app refuses to decode after that instant. There is no server, so the link cannot be remotely revoked and the ciphertext can still appear in history or logs.
- Old plaintext tokens still decode. Tokens without `expiresAt` do not expire.
- WhatsApp and email share **task titles in the message**, not the encrypted token.

## Clipboard

- Off by default.
- When enabled, may read clipboard text. Do not treat this as safe for passwords.

## External actions

No payments, no outbound Google API, no email send except `mailto:` / WhatsApp deep links the user triggers.
