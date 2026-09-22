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

## Environment

Copy `.env.example` to `.env.local` and configure the live addresses when the token is launched:

- `NEXT_PUBLIC_CIV_MINT` — CIV mint.
- `NEXT_PUBLIC_GOLD_MINT` — paired/reward asset mint.
- `NEXT_PUBLIC_GOLD_DECIMALS` — reward asset decimals.
- `NEXT_PUBLIC_GAME_TREASURY` — wallet receiving GOLD used for game utility.
- `NEXT_PUBLIC_SOLANA_RPC_URL` — dedicated Solana mainnet RPC recommended for production.
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

## Production checklist

Before enabling real GOLD spending: verify the exact quote mint on StonkFun, set a dedicated treasury, use a production Solana RPC, test a minimum-value transfer from a throwaway wallet, and replace local profile persistence with a server-authoritative account/match service before competitive rewards have monetary value.

## StonkFun integration notes

StonkFun's current public API is keyless and exposes token, pair and reward endpoints under `/api/public/v1`. Reward-mode launches are Token-2022 mints with immutable transfer taxes distributed to holders in the quote token. CIV intentionally consumes only read endpoints; token launch/signing stays on StonkFun so this app never handles creator private keys.
