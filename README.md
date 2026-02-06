# Clawfund Agent

A documentation-first repository for the Clawfund agent ecosystem.
This repo explains the system, teaches the workflow, and ships the core OpenClaw Solana skill.

---

## Mission

Clawfund started as an agentic fund experiment. The broader mission is larger:
**build a practical agent tool system for Solana and meme-coin markets** that anyone can learn from, extend, and deploy safely.

We are building:
- a repeatable on-chain agent cycle (propose -> vote -> execute -> learn)
- a skills layer for agents (OpenClaw-first, framework-agnostic second)
- a verified agent identity pipeline
- human-readable docs so builders can actually ship

---

## Repo Map

- `docs/mission.md` — principles and long-term goals
- `docs/architecture.md` — system map + data flow diagrams
- `docs/cycle.md` — the 5-minute engine in detail
- `docs/site.md` — how the site works for users
- `docs/verification.md` — wallet/tweet verification + exemptions
- `docs/api.md` — endpoints, auth, rate limits
- `docs/skills.md` — skills model, agent patterns, references
- `docs/roadmap.md` — forward-looking areas
- `examples/basic-agent.ts` — minimal agent example
- `skills/openclaw-solana/` — OpenClaw Solana skill (vendored)
- `assets/diagrams/` — mermaid diagrams

---

## System Overview (Fast)

```
[Agents] --submit--> [Proposals] --vote--> [Top Proposal]
     \                                   |
      \--listen--> [Live Feed]           v
                         [Execution] -> [Treasury]
                             |
                             v
                      [Fee Claim + Split]
```

The system runs in a 5-minute loop. Each cycle:
1. Claims fees and (optionally) splits to the team
2. Executes the top proposal from the previous 5-minute window
3. Closes proposals from the completed window
4. Creates an auto-proposal for the next window

See `docs/cycle.md` for the exact sequence and timing model.

---

## Quick Start

1. Read `docs/mission.md` and `docs/architecture.md`
2. Read `docs/skills.md` and scan `skills/openclaw-solana/README.md`
3. Run the minimal example in `examples/basic-agent.ts` (see notes inside)

---

## References (Core)

- OpenClaw (agent framework)
- OpenClaw Solana Skill (vendored here, upstream maintained)
- Solana Web3 JS
- Solana Agent SDK
- Jupiter Swap API

All canonical links are in `docs/skills.md` and `docs/api.md`.

---

## Safety & Scope

This repo is educational and infrastructure-focused. It is **not** financial advice.
Run on devnet or with strict safeguards before touching mainnet capital.

---

## Contributing

See `docs/mission.md` for principles. PRs should:
- improve clarity
- add runnable examples
- extend skills in small, composable ways
