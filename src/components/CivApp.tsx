"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CARDS, BattleState, Lane, chooseAiMove, createBattle, deploy, getCard, tickBattle } from "@/lib/game";
import { connectWallet, spendGold, tokenBalance } from "@/lib/solana";

type Market = {
  configured: boolean;
  token?: { symbol: string; marketCapUsd: number; volume24hUsd: number; status: string; graduationProgress: number; quote?: { symbol?: string } | null };
  rewards?: { distributedTokens?: number; payoutCount?: number; holderCount?: number } | null;
  source?: string;
};

type Profile = {
  coins: number;
  xp: number;
  trophies: number;
  wins: number;
  losses: number;
  faction: "Solari" | "Ironhold" | "Verdant" | "Ashborne";
  influence: number;
  cosmetics: string[];
};

const initialProfile: Profile = { coins: 600, xp: 0, trophies: 400, wins: 0, losses: 0, faction: "Solari", influence: 0, cosmetics: [] };

const shop = [
  { id: "founder-banner", name: "Founder Banner", price: 0.0025, kind: "cosmetic", description: "Permanent profile banner." },
  { id: "gold-emote", name: "Golden Salute", price: 0.005, kind: "cosmetic", description: "Battle emote; no combat advantage." },
  { id: "marble-arena", name: "Marble Arena", price: 0.015, kind: "cosmetic", description: "Alternate arena skin." },
  { id: "world-effort", name: "World Project", price: 0.001, kind: "influence", description: "Contribute GOLD to civilization progress." },
] as const;

function money(n = 0) {
  return Intl.NumberFormat("en-US", { notation: n > 999999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}

function hpWidth(value: number, max: number) { return `${Math.max(0, Math.min(100, (value / max) * 100))}%`; }

export default function CivApp() {
  const [market, setMarket] = useState<Market | null>(null);
  const [wallet, setWallet] = useState("");
  const [gold, setGold] = useState(0.0372);
  const [walletError, setWalletError] = useState("");
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [battle, setBattle] = useState<BattleState>(() => createBattle());
  const [selected, setSelected] = useState(CARDS[0].id);
  const [battleStarted, setBattleStarted] = useState(false);
  const [toast, setToast] = useState("");
  const lastFrame = useRef<number | null>(null);
  const aiClock = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("civ-profile-v1");
    if (saved) {
      try { setProfile({ ...initialProfile, ...JSON.parse(saved) }); } catch { /* ignore */ }
    }
    fetch("/api/civ").then((r) => r.json()).then(setMarket).catch(() => setMarket(null));
  }, []);

  useEffect(() => { localStorage.setItem("civ-profile-v1", JSON.stringify(profile)); }, [profile]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const refreshGold = useCallback(async (address: string) => {
    const mint = process.env.NEXT_PUBLIC_GOLD_MINT;
    if (!mint) return;
    try { setGold(await tokenBalance(address, mint)); } catch (e) { setWalletError(e instanceof Error ? e.message : "Could not read GOLD balance."); }
  }, []);

  async function handleConnect() {
    setWalletError("");
    try {
      const address = await connectWallet();
      setWallet(address);
      await refreshGold(address);
    } catch (e) { setWalletError(e instanceof Error ? e.message : "Wallet connection failed."); }
  }

  useEffect(() => {
    if (!battleStarted || battle.winner) return;
    let raf = 0;
    const loop = (time: number) => {
      const last = lastFrame.current ?? time;
      const dt = (time - last) / 1000;
      lastFrame.current = time;
      aiClock.current += dt;
      setBattle((current) => {
        let next = tickBattle(current, dt);
        if (aiClock.current > 1.15) {
          aiClock.current = 0;
          const move = chooseAiMove(next);
          if (move) next = deploy(next, "enemy", move.cardId, move.lane);
        }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lastFrame.current = null; };
  }, [battleStarted, battle.winner]);

  useEffect(() => {
    if (!battle.winner || !battleStarted) return;
    setBattleStarted(false);
    if (battle.winner === "player") {
      setProfile((p) => ({ ...p, wins: p.wins + 1, coins: p.coins + 90, xp: p.xp + 120, trophies: p.trophies + 26 }));
      setToast("Victory — +90 Coins, +120 XP, +26 trophies");
    } else if (battle.winner === "enemy") {
      setProfile((p) => ({ ...p, losses: p.losses + 1, coins: p.coins + 30, xp: p.xp + 45, trophies: Math.max(0, p.trophies - 18) }));
      setToast("Defeat — +30 Coins, +45 XP");
    } else setToast("Draw — +45 Coins");
  }, [battle.winner, battleStarted]);

  function startBattle() {
    aiClock.current = 0;
    setBattle(createBattle());
    setBattleStarted(true);
  }

  function place(lane: Lane) {
    if (!battleStarted || battle.winner) return;
    setBattle((s) => deploy(s, "player", selected, lane));
  }

  async function buy(item: (typeof shop)[number]) {
    if (item.kind === "cosmetic" && profile.cosmetics.includes(item.id)) return setToast("Already unlocked.");
    if (gold + 1e-9 < item.price) return setToast(`Not enough ${rewardSymbol} yet — keep playing; the reward asset is optional.`);
    try {
      const live = Boolean(wallet && process.env.NEXT_PUBLIC_GOLD_MINT && process.env.NEXT_PUBLIC_GAME_TREASURY);
      if (live) {
        await spendGold(wallet, item.price);
        await refreshGold(wallet);
      } else setGold((g) => Math.max(0, g - item.price));
      if (item.kind === "influence") setProfile((p) => ({ ...p, influence: p.influence + 10 }));
      else setProfile((p) => ({ ...p, cosmetics: [...p.cosmetics, item.id] }));
      setToast(live ? `${rewardSymbol} confirmed onchain.` : `Mock ${rewardSymbol} spent. Configure mints to go live.`);
    } catch (e) { setToast(e instanceof Error ? e.message : "Transaction failed."); }
  }

  const age = useMemo(() => {
    const mc = market?.token?.marketCapUsd ?? 0;
    if (mc >= 10_000_000) return "SPACE AGE";
    if (mc >= 5_000_000) return "MODERN AGE";
    if (mc >= 1_000_000) return "INDUSTRIAL AGE";
    if (mc >= 500_000) return "RENAISSANCE";
    if (mc >= 250_000) return "MEDIEVAL AGE";
    if (mc >= 100_000) return "CLASSICAL AGE";
    return "ANCIENT AGE";
  }, [market]);

  const distributed = market?.rewards?.distributedTokens ?? 0;
  const rewardSymbol = market?.token?.quote?.symbol || "GOLD";
  const selectedCard = getCard(selected);

  return (
    <main>
      {toast && <div className="toast">{toast}</div>}
      <nav className="nav">
        <div className="brand"><span className="brandMark">C</span><strong>CIV</strong><span className="alpha">ALPHA</span></div>
        <div className="navStats"><span>{age}</span><span>◈ {profile.trophies}</span><span>◎ {profile.coins} Coins</span></div>
        <button className="walletButton" onClick={handleConnect}>{wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "CONNECT WALLET"}</button>
      </nav>

      <section className="hero">
        <div>
          <div className="eyebrow">A WORLD BUILT BY ITS PLAYERS</div>
          <h1>BUILD YOUR ARMY.<br/><em>BUILD THE WORLD.</em></h1>
          <p>Fast real-time strategy with an economy that stays fair. Play for free. CIV holders receive GOLD through StonkFun; GOLD unlocks identity, world influence and utility — never raw battle power.</p>
          <div className="heroActions"><button className="primary" onClick={startBattle}>ENTER ARENA</button><a className="ghost" href="#economy">HOW GOLD WORKS</a></div>
          {walletError && <div className="errorText">{walletError}</div>}
        </div>
        <div className="worldCard">
          <div className="worldGlow" />
          <div className="worldTitle">WORLD STATE</div>
          <div className="age">{age}</div>
          <div className="progress"><span style={{ width: `${Math.min(100, Math.max(4, (market?.token?.graduationProgress ?? .41) * 100))}%` }} /></div>
          <div className="metricGrid">
            <div><small>CIV MARKET CAP</small><b>${money(market?.token?.marketCapUsd ?? 184200)}</b></div>
            <div><small>24H VOLUME</small><b>${money(market?.token?.volume24hUsd ?? 48200)}</b></div>
            <div><small>{rewardSymbol} DISTRIBUTED</small><b>{money(distributed || 1284.42)}</b></div>
            <div><small>HOLDERS REWARDED</small><b>{money(market?.rewards?.holderCount ?? 214)}</b></div>
          </div>
          <div className="sourceBadge">{market?.source === "stonkfun" ? "LIVE · STONKFUN" : "DEMO DATA · READY FOR MINT"}</div>
        </div>
      </section>

      <section className="section arenaSection" id="arena">
        <div className="sectionHead"><div><div className="eyebrow">REAL-TIME BATTLE</div><h2>CIV ARENA</h2></div><div className="battleMeta"><span>{Math.ceil(battle.timeLeft)}s</span><span className={battleStarted ? "liveDot" : ""}>{battleStarted ? "LIVE" : "READY"}</span></div></div>
        <div className="arenaShell">
          <div className="arena">
            <div className="river" />
            {[0,1].map((lane) => <div key={lane} className={`lane lane${lane}`} onClick={() => place(lane as Lane)}><span>DEPLOY LANE {lane + 1}</span></div>)}
            {[0,1].map((lane) => (
              <div key={`pt-${lane}`} className={`tower playerTower laneTower${lane}`}><b>{Math.ceil(battle.playerTowers[lane as Lane])}</b><i style={{width: hpWidth(battle.playerTowers[lane as Lane],850)}} /></div>
            ))}
            {[0,1].map((lane) => (
              <div key={`et-${lane}`} className={`tower enemyTower laneTower${lane}`}><b>{Math.ceil(battle.enemyTowers[lane as Lane])}</b><i style={{width: hpWidth(battle.enemyTowers[lane as Lane],850)}} /></div>
            ))}
            <div className="citadel playerCitadel"><span>◆</span><b>{Math.ceil(battle.playerCitadel)}</b></div>
            <div className="citadel enemyCitadel"><span>◆</span><b>{Math.ceil(battle.enemyCitadel)}</b></div>
            {battle.units.map((u) => {
              const c = getCard(u.cardId);
              return <div key={u.id} className={`unit ${u.side} unitLane${u.lane}`} style={{ left: `${u.x}%` }} title={c.name}><span>{c.icon}</span><i style={{width: hpWidth(u.hp,u.maxHp)}} /></div>;
            })}
            {!battleStarted && !battle.winner && <div className="arenaOverlay"><strong>ARENA READY</strong><span>Choose a card, start battle, then deploy into either lane.</span><button onClick={startBattle}>START MATCH</button></div>}
            {battle.winner && <div className="arenaOverlay"><strong>{battle.winner === "player" ? "VICTORY" : battle.winner === "enemy" ? "DEFEAT" : "DRAW"}</strong><span>{battle.winner === "player" ? "+90 Coins · +120 XP" : "Your next match is ready."}</span><button onClick={startBattle}>BATTLE AGAIN</button></div>}
          </div>

          <aside className="deckPanel">
            <div className="energy"><span>ENERGY</span><b>{battle.playerEnergy.toFixed(1)} / 10</b><i><u style={{width:`${battle.playerEnergy*10}%`}} /></i></div>
            <div className="cards">
              {CARDS.map((card) => <button key={card.id} onClick={() => setSelected(card.id)} className={selected === card.id ? "selected" : ""}><span className="cardCost">{card.cost}</span><span className="cardIcon">{card.icon}</span><b>{card.name}</b><small>{card.blurb}</small></button>)}
            </div>
            <div className="selectedInfo"><strong>{selectedCard.name}</strong><span>{selectedCard.hp} HP · {selectedCard.damage} DMG · {selectedCard.cost} Energy</span></div>
          </aside>
        </div>
      </section>

      <section className="section economy" id="economy">
        <div className="sectionHead"><div><div className="eyebrow">ONCHAIN UTILITY, NOT PAY-TO-WIN</div><h2>USE YOUR {rewardSymbol}</h2></div><div className="goldBalance"><small>YOUR {rewardSymbol}</small><strong>{gold.toFixed(4)}</strong></div></div>
        <div className="economyGrid">
          <div className="explainCard"><h3>Two economies. One fair game.</h3><p><b>Coins + XP</b> come from playing and drive normal progression. <b>GOLD</b> comes from the StonkFun reward pair and unlocks cosmetics, identity, world projects and special access. A larger wallet does not make your Legion hit harder.</p><div className="flow"><span>HOLD / TRADE CIV</span><i>→</i><span>RECEIVE GOLD</span><i>→</i><span>SHAPE CIV</span></div></div>
          <div className="shopGrid">
            {shop.map((item) => {
              const owned = item.kind === "cosmetic" && profile.cosmetics.includes(item.id);
              return <button className="shopItem" key={item.id} onClick={() => buy(item)} disabled={owned}><div><span>{item.kind === "influence" ? "◈" : "✦"}</span><b>{item.name}</b></div><p>{item.description}</p><footer><strong>{owned ? "OWNED" : `${item.price} ${rewardSymbol}`}</strong><span>{item.kind === "influence" ? `Influence ${profile.influence}` : "Permanent"}</span></footer></button>;
            })}
          </div>
        </div>
      </section>

      <section className="section factionSection">
        <div className="sectionHead"><div><div className="eyebrow">PERSISTENT WORLD</div><h2>YOUR CIVILIZATION</h2></div></div>
        <div className="factions">
          {(["Solari","Ironhold","Verdant","Ashborne"] as const).map((f, i) => <button key={f} className={profile.faction === f ? "active" : ""} onClick={() => setProfile((p)=>({...p,faction:f}))}><span>{["☀","⬢","❧","△"][i]}</span><b>{f}</b><small>{["Speed & pressure","Defense & control","Support & sustain","Siege & aggression"][i]}</small></button>)}
        </div>
        <div className="worldProject"><div><small>GLOBAL PROJECT</small><h3>THE GREAT CITADEL</h3><p>Every GOLD contribution adds world influence. Any amount counts; rewards are participation-based, not top-spender based.</p></div><div className="projectProgress"><strong>72%</strong><div className="progress"><span style={{width:"72%"}} /></div><small>7,284,201 / 10,000,000 WORLD POINTS</small></div></div>
      </section>

      <footer className="footer"><div className="brand"><span className="brandMark">C</span><strong>CIV</strong></div><p>Built for StonkFun. GOLD is optional game utility; battles are skill-first. Alpha uses local progression until production persistence is connected.</p><span>© 2026 CIV</span></footer>
    </main>
  );
}
