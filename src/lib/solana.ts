import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

type InjectedProvider = {
  publicKey?: PublicKey;
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect?: () => Promise<void>;
  signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string }>;
};

declare global {
  interface Window {
    solana?: InjectedProvider;
    backpack?: { solana?: InjectedProvider };
  }
}

export const rpcUrl = () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export function walletProvider(): InjectedProvider | null {
  if (typeof window === "undefined") return null;
  return window.solana ?? window.backpack?.solana ?? null;
}

export async function connectWallet() {
  const provider = walletProvider();
  if (!provider) throw new Error("No compatible Solana wallet found. Install Phantom or Backpack.");
  const result = await provider.connect();
  return result.publicKey.toBase58();
}

export async function tokenBalance(owner: string, mint: string): Promise<number> {
  if (!owner || !mint) return 0;
  const connection = new Connection(rpcUrl(), "confirmed");
  const accounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(owner), { mint: new PublicKey(mint) });
  return accounts.value.reduce((sum, entry) => {
    const amount = entry.account.data.parsed?.info?.tokenAmount?.uiAmountString;
    return sum + Number(amount ?? 0);
  }, 0);
}

export async function spendGold(owner: string, amount: number): Promise<string> {
  const mintString = process.env.NEXT_PUBLIC_GOLD_MINT;
  const treasuryString = process.env.NEXT_PUBLIC_GAME_TREASURY;
  const decimals = Number(process.env.NEXT_PUBLIC_GOLD_DECIMALS || 6);
  if (!mintString || !treasuryString) throw new Error("GOLD spending is not configured yet.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid GOLD amount.");

  const provider = walletProvider();
  if (!provider?.publicKey) throw new Error("Connect your wallet first.");
  if (provider.publicKey.toBase58() !== owner) throw new Error("Connected wallet changed.");

  const connection = new Connection(rpcUrl(), "confirmed");
  const mint = new PublicKey(mintString);
  const treasury = new PublicKey(treasuryString);
  const mintInfo = await connection.getAccountInfo(mint, "confirmed");
  if (!mintInfo) throw new Error("GOLD mint not found.");
  const tokenProgram = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const source = getAssociatedTokenAddressSync(mint, provider.publicKey, false, tokenProgram);
  const destination = getAssociatedTokenAddressSync(mint, treasury, true, tokenProgram);
  const raw = BigInt(Math.round(amount * 10 ** decimals));

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, destination, treasury, mint, tokenProgram),
    createTransferCheckedInstruction(source, mint, destination, provider.publicKey, raw, decimals, [], tokenProgram),
  );
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = provider.publicKey;
  const sent = await provider.signAndSendTransaction(tx);
  await connection.confirmTransaction({ signature: sent.signature, blockhash, lastValidBlockHeight }, "confirmed");
  return sent.signature;
}
