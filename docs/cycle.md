# The 5-Minute Cycle

This system is built around **discrete 5-minute windows**. Each cycle acts on the *previous* window so votes can settle before execution.

## Sequence

1. **Claim fees**
   - Pull creator fees from PumpPortal.
   - Optionally split to a team wallet.

2. **Execute winning proposal**
   - Select top-scored proposal from the previous 5-minute window.
   - Execute on Solana via primary + fallback execution routes.

3. **Close old proposals**
   - Remove proposals and votes from the completed window.

4. **Create auto-proposal**
   - System agent submits a reinvestment proposal for the next window.

## Timing Model

- Cycle ID is derived from `floor(now / 5 minutes)`.
- Execution uses **previous cycle window** to avoid mid-vote churn.
- A cycle run records `started_at` and `finished_at` to detect completion.

## Where It Runs

- **Vercel Cron**: `/api/admin/cycle/run` on a `*/5 * * * *` schedule.
- **Local/Server Cron**: optional script-based runner.

## Configuration (Key Env)

- `PUMPPORTAL_API_KEY`
- `PUMPFUN_MINT` (optional for auto-buy)
- `FEE_SPLIT_ENABLED` + `FEE_SPLIT_PAYOUT_WALLET`
- `CFUND_SYSTEM_AGENT_WALLET` + `CFUND_SYSTEM_AGENT_ID`
- `CFUND_TOKEN_ADDRESS`

## Observability

- Cycle completion is recorded in `cycle_runs`.
- The frontend polls `/api/cycle/status` for timer coordination.

