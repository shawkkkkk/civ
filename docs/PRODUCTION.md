# CIV Production Cutover

The repository is intentionally safe to run before CIV launches. With no mint or treasury environment variables, market values and GOLD spending remain in demo mode.

## Phase 1 — public gameplay preview

Safe to ship now:

- landing experience,
- AI arena,
- deck interaction,
- Coins / XP / trophies stored locally,
- faction selection,
- mock GOLD utility,
- public StonkFun read integration once a CIV mint exists.

Do **not** point `NEXT_PUBLIC_GAME_TREASURY` at a real treasury while utility ownership is still stored only in the browser.

## Phase 2 — token launch integration

After CIV exists on StonkFun:

1. Record the canonical CIV mint.
2. Record the exact quote/reward GOLD mint.
3. Verify mint program (classic SPL or Token-2022).
4. Verify token decimals.
5. Set a dedicated production Solana RPC.
6. Set `NEXT_PUBLIC_CIV_MINT`.
7. Set `NEXT_PUBLIC_GOLD_MINT`.
8. Verify the website reports the same pair/quote asset as StonkFun.
9. Test balance reads with a disposable wallet.

## Phase 3 — server-authoritative accounts

Before accepting real GOLD for utility:

- Sign-in by wallet challenge (nonce + signature).
- Store player profile server-side.
- Record every GOLD purchase intent.
- Verify the confirmed Solana transaction server-side.
- Require destination treasury, mint and exact/allowed amount.
- Enforce transaction-signature uniqueness.
- Grant the purchased utility in one idempotent server operation.
- Add rate limits and abuse controls.
- Keep a transaction ledger for reconciliation.

The current localStorage profile is deliberately not trusted for monetary entitlements.

## Phase 4 — real-time PvP

Production PvP needs an authoritative realtime service rather than a browser deciding battle results.

Minimum:

- queue/matchmaking,
- authoritative simulation,
- reconnect window,
- latency compensation,
- replay/event log,
- rating updates,
- anti-cheat validation,
- match cancellation rules,
- observability.

The current AI mode remains useful as training and fallback.

## Phase 5 — operations

Before a public token-linked launch:

- Production domain and HTTPS.
- Error monitoring.
- Dedicated RPC with usage alerts.
- Wallet transaction simulation before signing where supported.
- Treasury monitoring.
- Analytics that do not expose wallet data unnecessarily.
- Content moderation for usernames/future chat.
- Terms/privacy disclosures appropriate for the jurisdictions served.
- Emergency switch that disables real GOLD spending without disabling gameplay.
- Dependency/security scanning and regular upgrades.

## Environment variables

```
NEXT_PUBLIC_CIV_MINT=
NEXT_PUBLIC_GOLD_MINT=
NEXT_PUBLIC_GOLD_DECIMALS=
NEXT_PUBLIC_GAME_TREASURY=
NEXT_PUBLIC_SOLANA_RPC_URL=
STONKFUN_API_BASE=https://www.stonkfun.xyz/api/public/v1
```

Never commit private keys, seed phrases, RPC admin secrets or treasury signing keys. The game does not need custody of a player's wallet.
