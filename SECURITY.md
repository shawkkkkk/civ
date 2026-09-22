# Security

## Current status

CIV is alpha software and has not been independently audited. The current build is safe by default because real GOLD spending is disabled until mint and treasury variables are explicitly configured.

## Wallet safety

- CIV never asks for a seed phrase or private key.
- Player asset transfers require the connected wallet to sign.
- The game should never custody a user's wallet.
- Public mint and treasury addresses may be exposed; signing secrets must never be exposed.

## Real GOLD warning

Do not enable a production treasury until purchases and entitlements are verified server-side. Browser localStorage is user-controlled and is not an acceptable source of truth for paid entitlements.

Before enabling real utility spending, implement server-side transaction verification, idempotency, replay protection and an emergency disable switch.

## Reporting

For a private vulnerability report, contact the repository owner through GitHub rather than posting exploitable details in a public issue.
