# CIV Game Design

## Product sentence

CIV is a fast, two-lane real-time strategy game where everyone can play for free, while holders of CIV receive the launch pair's reward asset (GOLD) and can use small fractions of GOLD for identity, cosmetics, world-building and special access.

## Non-negotiable rule

**GOLD never buys raw ranked combat power.**

A wallet with 100 GOLD must not get stronger tower damage, faster Energy regeneration, higher unit HP, shorter cooldowns or matchmaking advantages than a wallet with 0.001 GOLD.

This prevents the reward economy from turning the core game into pay-to-win.

## Match loop

1. Player enters a 1v1 match.
2. Both players begin with the same Energy rules.
3. Eight-card decks deploy units into either lane.
4. Units move, fight and attack lane towers.
5. Destroying a lane tower exposes the enemy Citadel.
6. Destroy the Citadel or lead on remaining structure health when time expires.
7. Earn Coins, XP and trophies from play.

## Alpha cards

| Card | Role | Energy |
| --- | --- | ---: |
| Legion | frontline | 3 |
| Archers | ranged | 3 |
| Cavalry | fast pressure | 4 |
| Guard | defense | 2 |
| Mage | heavy ranged | 5 |
| Raiders | fast cycle | 2 |
| War Ram | structure pressure | 4 |
| Oracle | flexible support | 3 |

The alpha uses normalized card stats. Competitive balance should be tuned from match telemetry before any ranked rewards are valuable.

## Player progression

**Coins** are earned from matches and future quests.  
**XP** represents play progression.  
**Trophies** drive ranked placement.  
**GOLD** is the optional onchain utility asset.

Normal competitive progression must remain obtainable without buying or holding CIV.

## GOLD utility

GOLD is intentionally useful at very small denominations so a small CIV holder is not excluded.

Initial utility targets:

- Founder/profile banners.
- Battle emotes.
- Arena skins.
- Faction identity changes.
- Global civilization projects.
- Seasonal cosmetic access.
- Special non-wagered event tickets.
- Cosmetic crafting or rerolls.

The initial alpha examples range from 0.001 to 0.015 GOLD.

## World layer

Players choose one of four factions:

- Solari — speed / pressure identity.
- Ironhold — defense / control identity.
- Verdant — support / sustain identity.
- Ashborne — siege / aggression identity.

Faction choice is thematic in the alpha. Future seasons can translate match wins into territory influence without changing individual unit stats.

## Civilization ages

CIV market milestones can change the presentation of the world:

- Ancient
- Classical
- Medieval
- Renaissance
- Industrial
- Modern
- Space

Market milestones should unlock **possibilities and cosmetics**, not competitive stat multipliers.

## Global projects

Players may voluntarily contribute very small amounts of GOLD to shared projects. Rewards should be based on participation/milestones, not simply ranking the largest spenders.

Example: The Great Citadel.

A contribution can create:
- permanent profile history,
- faction/world influence,
- cosmetic badges,
- visible world progress.

It must not create stronger ranked units.

## Future PvP

The browser battle simulation in the alpha is deterministic enough for prototyping, but production PvP should use a server-authoritative match process:

1. Queue by rating and region.
2. Server generates match seed.
3. Clients send validated deploy intents.
4. Server owns clock, Energy, unit state and damage.
5. Clients render server snapshots/interpolation.
6. Results are written transactionally.
7. Replays store seed + player intents.
8. Anti-cheat flags impossible input timing/state.

Do not attach monetary prizes to client-authoritative matches.
