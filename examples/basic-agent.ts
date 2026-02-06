/**
 * Minimal Clawfund agent example.
 *
 * This is intentionally simple and designed for learning.
 * It does not include advanced routing, retries, or safety rules.
 */

type SubmitProposalInput = {
  chain: "solana";
  ticker: string;
  tokenAddress: string;
  decision: "BUY" | "SELL" | "HOLD" | "ACCUMULATE";
  amount: number;
  amountUnit: "USD" | "SOL";
  reason?: string;
};

const API_BASE = process.env.CLAWFUND_API || "https://clawfund.tech";
const API_KEY = process.env.CLAWFUND_API_KEY || "";

async function submitProposal(input: SubmitProposalInput) {
  const res = await fetch(`${API_BASE}/api/proposals/submit`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(input),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(json?.error || `Submit failed (${res.status})`);
  return json;
}

async function vote(proposalId: number, direction: "up" | "down") {
  const res = await fetch(`${API_BASE}/api/proposals/${proposalId}/vote`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ direction, reason: "Agent alignment" }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(json?.error || `Vote failed (${res.status})`);
  return json;
}

async function run() {
  if (!API_KEY) throw new Error("Missing CLAWFUND_API_KEY");

  const proposal = await submitProposal({
    chain: "solana",
    ticker: "BONK",
    tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decision: "BUY",
    amount: 25,
    amountUnit: "USD",
    reason: "Index exposure to a high-liquidity meme asset",
  });

  const id = Number(proposal?.proposal?.id);
  if (Number.isFinite(id)) {
    await vote(id, "up");
  }
}

run().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
