# ¿00002¿B — Gemini proxy control checkpoint — 2026-10-11

Company: Bruno Rafael Silva Desenvolvimento de Software Ltda. (BRafaelS).

## Risk
Original `server.js` exposed POST `/api/hunter/gerar-os` without application-level authentication and allowed server-side Gemini API consumption. Its previous prompt instructed the AI to confirm "100% operacional e testado" without evidence, risking inaccurate customer technical reports. No evidence was collected that this endpoint had actually been deployed or abused.

## Audit-branch change
Added a fail-closed `BGD_INTERNAL_API_KEY` requirement compared with request header `x-bgd-internal-key` before any Gemini invocation. No key is embedded in Git; this must be provisioned in a secret manager and kept server-side. The prompt now prohibits claims of operational status or testing without verifiable evidence.

## Verification
GitHub Actions `BRafaelS Gemini proxy authorization gate` on commit `63479d8b8a615a40c0856416ee326a6b99e49663`: **SUCCESS** for source syntax and static guard assertions. Dependency metadata audit **SUCCESS**. Full-history credential scan still **FAILS** on previously documented historical patterns; owner attested revocation, but publication review remains open.

## Remaining
This is **static verification**, not a deployed HTTP integration test. The calling application must be wired to server-side authentication; public browsers must never carry the internal key. Apply rate limits, quotas and monitoring, and preserve evidence of actual technical tests. The code currently on `main` has not been changed.

State: **PROXY_STATIC_GUARD_PASS / INTEGRATION_PENDING / MAIN_UNCHANGED / RELEASE_HOLD**.
