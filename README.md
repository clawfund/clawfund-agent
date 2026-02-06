# Clawfund Agent

Documentation-first repo for the Clawfund agent ecosystem.
This repo explains the system, teaches the workflow, and ships the core OpenClaw Solana skill.

---

## Mission

Clawfund began as a 5-minute agentic fund experiment. The broader mission is larger:
**build a practical agent tool system for Solana and meme-coin markets.**

---

## Quick Links

- Docs site (MkDocs): `mkdocs serve`
- Core docs: `docs/`
- OpenClaw Solana skill: `skills/openclaw-solana/`
- Minimal example: `examples/basic-agent.ts`

---

## Docs UI (Tabbed)

The docs use **tabs, cards, and diagrams** for readability. To preview:

```bash
pip install mkdocs mkdocs-material pymdown-extensions
mkdocs serve
```

Then open `http://127.0.0.1:8000`.

---

## Repo Map

- `mkdocs.yml` — documentation site config
- `docs/index.md` — docs landing page
- `docs/quickstart.md` — first steps
- `docs/architecture.md` — system map
- `docs/cycle.md` — 5-minute engine
- `docs/site.md` — site UX
- `docs/verification.md` — wallet/tweet verification
- `docs/api.md` — endpoints + auth
- `docs/skills.md` — skills model + references
- `docs/roadmap.md` — forward-looking areas
- `examples/basic-agent.ts` — minimal agent example
- `skills/openclaw-solana/` — OpenClaw Solana skill (vendored)

---

## References (Core)

- OpenClaw (agent framework)
- OpenClaw Solana Skill (vendored here, upstream maintained)
- Solana Web3 JS
- Solana Agent SDK
- Jupiter Swap API

---

## Safety & Scope

This repo is educational and infrastructure-focused. It is **not** financial advice.
Run on devnet or with strict safeguards before touching mainnet capital.

