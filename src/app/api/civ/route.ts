import { NextResponse } from "next/server";

const API = process.env.STONKFUN_API_BASE || "https://www.stonkfun.xyz/api/public/v1";

export const runtime = "nodejs";
export const revalidate = 30;

export async function GET() {
  const mint = process.env.NEXT_PUBLIC_CIV_MINT;
  if (!mint) {
    return NextResponse.json({
      configured: false,
      token: { symbol: "CIV", marketCapUsd: 184200, volume24hUsd: 48200, status: "new", graduationProgress: 0.41 },
      rewards: { distributedTokens: 1284.42, payoutCount: 93, holderCount: 214 },
      source: "mock",
    });
  }
  try {
    const [tokenResponse, rewardResponse] = await Promise.all([
      fetch(`${API}/tokens/${mint}`, { next: { revalidate: 30 } }),
      fetch(`${API}/tokens/${mint}/rewards`, { next: { revalidate: 30 } }),
    ]);
    if (!tokenResponse.ok) throw new Error(`StonkFun token request failed (${tokenResponse.status})`);
    const tokenJson = await tokenResponse.json();
    const rewardsJson = rewardResponse.ok ? await rewardResponse.json() : null;
    const token = tokenJson.data?.token ?? tokenJson.data ?? {};
    return NextResponse.json({
      configured: true,
      token: {
        symbol: token.symbol ?? "CIV",
        marketCapUsd: token.market?.marketCapUsd ?? 0,
        volume24hUsd: token.market?.volume24hUsd ?? 0,
        status: token.status ?? "unknown",
        graduationProgress: token.graduationProgress ?? 0,
        quote: token.quote ?? null,
      },
      rewards: rewardsJson?.data?.rewards ?? null,
      source: "stonkfun",
    });
  } catch (error) {
    return NextResponse.json({ configured: true, error: error instanceof Error ? error.message : "Unknown error" }, { status: 502 });
  }
}
