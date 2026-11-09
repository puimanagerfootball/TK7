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
- Preserve the owner's 30-day registration retention job and bilingual privacy notice. Fixture/score tables and administrator accounts have separate retention.
- Keep privacy.html synchronized with line-registration/privacy.html using the release script. Publish privacy.html and browser-safety.js to the LIFF mirror.
- Never unregister unrelated service workers on the shared GitHub Pages origin.

# Code and performance requirements

- Keep score persistence in js/score-writer.js and numeric statistics in js/match-stats.js. Idle navigation must not write schedules.
- Score/schedule edits compare updated_at before writing. Keep failed drafts and the explicit retry/discard flows; never silently overwrite a conflicting server revision.
- Render the visible page only. Background score updates must not reset unsaved setup fields.
- Keep saved fixture order, scores and times unchanged unless the user edits them. New fixtures use exactly the minutes entered in the form.
- Use `node scripts/sync-liff-site.mjs <existing-tk7-site-release-path>` for the LIFF mirror. It copies required browser assets only, excluding server/admin-only code.
- The user replaced the legacy copy/group-merge menu with all-team summary, one-team summary and LINE import actions. Keep legacy text formats supported by the import parser.
- Web and LIFF summaries use roster-summary.js and seven numbered slots. One-team summaries allow choosing a colour; dialogs expose send/close only.
- Import is an approved-admin preview/confirm action. Missing teams stay unchanged. Empty numbered slots delete only after the preview is explicitly confirmed. Preserve revision checks, idempotency and atomic audit writes.
- Registration actions use two columns on desktop and mobile. Privacy belongs first in the help/members/logout control group.
- Shared roster text contains the title, date/time, TK7 Google Maps link, colour headings, seven slots and registration link. Omit totals, registration status, capacity counts, empty-roster labels and the Snapshot footer.
