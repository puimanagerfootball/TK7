# TK7 security review — 5.1.0

Reviewed 2026-11-05. Scope: current web/LIFF source, LINE API, database grants/RLS, dependency delivery and release checks. This applies selected [OWASP ASVS 5.0 guidance](https://asvs.owasp.org/); it is not an independent penetration test or an ASVS, ISO or PDPA certification.

## Implemented

- Server verifies LINE identity; client-supplied identities cannot replace the verified actor. Input uses bounded streaming JSON (20,000 bytes), strict UTF-8, action allowlists and bounded tokens. Unexpected server errors are sanitized.
- Private atomic per-account quotas: 30 mutations and 120 reads per minute after LINE verification. Counters store SHA-256 subjects. Requests clean up at most 100 counters older than ten minutes; idle rows may remain until later traffic. This is not an IP firewall or protection for every Supabase/Auth endpoint.
- Mutations and their audit record commit together. Retries reuse request IDs and do not duplicate audit records. Invalid audit writes roll back the mutation.
- Anonymous clients cannot read private roster RPCs or profiles. Pending web accounts cannot grant themselves approval or write schedules. Trigger functions and new function defaults no longer grant unnecessary public execution. Service-only RPCs remain inaccessible to browser roles.
- Browser libraries are locally versioned with SHA-384 integrity checks and included licenses. See vendor-dependencies.json. Official LINE SDK remains a provider-managed exception. CI checks the generated Edge bundle, automated tests and direct-package OSV advisories.
- Browser referrer policy and baseline CSP restrict object embedding and base URL changes. New/reset password UI requires 15 characters. Repository ignores common credential files.

## Explicit product authorization

The owner confirmed on 2026-11-05 that authenticated LINE participants may continue editing, moving and deleting all shared roster entries, including other participants' entries. This is collaborative group authorization, not per-person ownership protection. Anyone with the registration link and a valid LINE login can exercise that access. Web administration remains separately role-gated. Public schedules/templates remain intentionally public. Audit identifies the verified account but does not prevent authorized destructive edits.

## Verification

- 120 automated tests passed; generated Edge bundle matches source.
- Real database smoke test passed inside a rollback-only transaction: role escalation, anonymous access, signup triggers, independent quota enforcement, actor spoofing, atomic audit rollback and replay deduplication. No fixture data persisted.
- OSV reported no listed advisories for the three direct vendored package versions at review time. This is not a complete transitive dependency audit or a guarantee of absence of vulnerabilities.

## Remaining operator controls and limitations

- Supabase Auth server password minimum, leaked-password protection and MFA enrollment/enforcement still require dashboard configuration and verification. The available connector cannot update these settings; frontend length validation does not enforce server password policy. Leaked-password protection was reported disabled by the advisor.
- Existing implicit Auth flow was retained for cross-device password reset behavior. A PKCE migration requires a separately tested reset flow.
- CSP is a baseline, not a strict script-src policy. Custom HSTS/frame-ancestors headers, WAF quotas and backup/restore/retention procedures have not been verified across both hosting providers.
- Database advisor findings for pg_net in public and intentionally exposed role-check helpers remain. Private RLS tables without browser policies intentionally deny direct access.
- Full Git history secret scanning, independent penetration testing, legal/privacy review and comprehensive transitive bundle analysis were not completed. CI is configured, but mandatory protected-branch checks require repository administration.
- Browser automation could not initialize in the current bracketed Windows workspace path. Real phone/desktop LINE picker, visual behavior and login/reset flows need device verification; automated tests do not replace those checks.

Do not include LINE tokens, passwords or service-role keys in issue reports. Use the deployment's private administrator channel for sensitive findings.
