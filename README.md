# CIV

**Build your army. Build the world.**

CIV is a real-time browser strategy game designed around StonkFun reward-mode launches. The competitive game is free-to-play and skill-first; the quote asset (GOLD) is optional utility for cosmetics, identity, global projects and special access rather than raw combat power.

## What is already implemented

- Playable two-lane real-time arena with eight cards, Energy, towers, citadels and AI opponent.
- Persistent local profile with Coins, XP, trophies, wins/losses, faction selection and cosmetic ownership.
- GOLD utility shop with tiny-price actions so small holders can participate.
- Solana wallet connection (Phantom/compatible injected wallets).
- Live SPL/Token-2022 GOLD balance reading from the configured mint.
- Onchain GOLD spending to a configured game treasury using a signed wallet transaction.
- StonkFun server route that reads CIV market data and reward-distribution totals from the public API.
- Mock mode when CIV/GOLD mints are not live yet.
- Responsive dark/gold launch UI, CI, unit tests and production build.

## Economy

**Coins + XP:** earned by playing. Used for normal progression.  
**GOLD:** received through the StonkFun reward pair. Used for cosmetics, world influence and other non-pay-to-win utility.  
**CIV:** the launch token whose market state can drive world-era presentation and community events.

The core rule is simple: **GOLD never buys raw ranked combat power.** See [the game design spec](docs/GAME_DESIGN.md).

## Environment

Copy `.env.example` to `.env.local` and configure the live addresses when the token is launched:

- `NEXT_PUBLIC_CIV_MINT` — CIV mint.
- `NEXT_PUBLIC_GOLD_MINT` — paired/reward asset mint.
- `NEXT_PUBLIC_GOLD_DECIMALS` — reward asset decimals.
- `NEXT_PUBLIC_GAME_TREASURY` — wallet receiving GOLD used for game utility.
- `NEXT_PUBLIC_SOLANA_RPC_URL` — dedicated Solana mainnet RPC recommended for production.
- `NEXT_PUBLIC_SITE_URL` — deployed canonical site origin, used by the sitemap.
- `STONKFUN_API_BASE` — defaults to `https://www.stonkfun.xyz/api/public/v1`.

If mint/treasury variables are empty the site runs in safe demo mode and never asks a wallet to send funds.

## Run

```bash
npm install
npm run dev
```

Verification:

```bash
npm run lint
npm test
npm run build
```

GitHub Actions runs the same verification on every push and pull request.

## Before real funds

The playable alpha is ready to host in demo/read-only mode. **Do not enable a real GOLD treasury until paid entitlements are server-authoritative.** Browser localStorage is intentionally used only for the alpha.

The full handoff is in:

- [Production cutover](docs/PRODUCTION.md)
- [Game/economy design](docs/GAME_DESIGN.md)
- [Security](SECURITY.md)

## StonkFun integration notes

StonkFun's public API exposes token, pair and reward reads under `/api/public/v1`. Reward-mode launches use Token-2022 transfer taxes to distribute the quote token to holders. CIV consumes only public reads; creator private keys never belong in this app.

The pair itself must be verified as launchable on StonkFun before the CIV launch. Once the canonical CIV and GOLD mint addresses exist, add them through environment variables rather than hard-coding them.
