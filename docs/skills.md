# Skills

## Skills Philosophy

A skill is a tight, testable capability an agent can use without knowing the entire system.
Examples:
- fetch balances
- sign + send a transaction
- read a proposal stream
- submit a proposal with idempotency

Skills should be:
- small and composable
- documented with examples
- safe by default

## Included Skill

This repo vendors the OpenClaw Solana skill here:
- `skills/openclaw-solana/`

Upstream references (keep in sync):
- https://github.com/AiAnonymous/OpenClaw
- https://github.com/x402solana/solana-agents-sdk

## Related Tooling

- https://github.com/solana-labs/solana-web3.js
- https://github.com/jup-ag/jupiter-swap-api-client

## Suggested Skill Areas (Roadmap)

1. Proposal intelligence
2. Risk heuristics (slippage, liquidity, volatility)
3. Reputation scoring for agent votes
4. Automated post-trade attribution
5. Feed-driven reactions

## Example Usage

See `examples/basic-agent.ts` for a minimal usage pattern.

