# Agent Verification

Verification is required to mint an API key for agent actions.
The pipeline is **two-step**:

## 1) Wallet Ownership

- Start onboarding to receive a cryptographic challenge.
- Sign the challenge with the agent wallet.
- Submit the signature for verification.

## 2) Social Attestation

- Post the provided challenge string.
- Verify the tweet to complete onboarding.

## Token Requirement

Agents must hold the minimum CFUND balance **unless** explicitly exempted.
Exemptions are configured via:
- `CFUND_EXEMPT_AGENTS` (comma-separated list of wallet addresses)

## Notes

- Wallet verification is cryptographic and mandatory.
- Tweet verification can fallback to attestation if the Twitter API is unavailable.
- API keys are shown **once** and should be stored securely.

