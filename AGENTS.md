# Release requirements

- The user requires TK7 and LINE LIFF to display the same version on every update.
- Run `node scripts/release-version.mjs <new-version>` before publishing. This updates both displayed versions and asset cache keys, and copies the web stylesheet used for LIFF schedule images.
- Publish both GitHub Pages and the existing LINE LIFF Sites mirror when browser assets or versions change. Include new browser dependencies in the mirror.
- Schedule images use the real web stylesheet and export layout. Keep the native image sharing, clipboard and download behavior consistent with the main website.

# Security requirements

- Never put service-role keys, LINE tokens or private credentials in browser assets or logs.
- Keep LINE identity verification, private quotas and atomic audit writes enabled.
- Rebuild the Edge bundle with `node scripts/build-edge.mjs` after API changes; CI checks that it matches source.
- Verify vendor hashes and licenses when updating browser libraries. Keep the official LINE SDK exception documented.
- Run the automated tests before deployment. Database security smoke tests must run in a rollback-only transaction.
- Do not claim OWASP/PDPA/ISO compliance without a scoped independent assessment.
- New SQL functions must declare their intended EXECUTE grants; defaults no longer expose new functions to public clients.
