# TK7 5.1.2 — correctness, performance and cleanup

2026-11-05, Asia/Bangkok. Hosting migration and MFA enforcement remain deferred. This release does not claim to close those security work items.

## Fixed

- Score saves previously rewrote the whole schedule on navigation/pagehide even without edits. Only dirty dates now save. Drafts are isolated by date, rapid edits coalesce, writes serialize, failures retain their draft, and the user can retry or explicitly discard before signing out.
- Writes compare the original updated_at revision. A concurrent schedule/score edit changes zero rows instead of silently overwriting another device. A missing revision requires reading and checking the original schedule first. In a conflict, users must retain their draft and reload/reconcile; the app does not silently choose a winner.
- Pending score drafts survive late reads and deferred Realtime events. Logout flushes while authentication is still available. Browser unload warnings protect unsaved drafts where supported; drafts are memory-only, so mobile force-quit/power loss is not guaranteed recoverable.
- Auth state callbacks defer database work until after the Auth session lock is released. Late profile responses cannot restore a previous account's permissions. Cached profile IDs must match the signed-in user.
- New match durations use the entered value directly; removed the hidden +1 on save/-1 on load. Existing saved schedules and durations were not migrated or reordered. New input requires whole minutes 1–60 and a valid kickoff time.
- Numeric score parsing rejects markup, invalid numbers and prototype property names. Legacy numeric strings calculate as numbers rather than concatenating. No database content was rewritten to normalize scores.
- Replaced reliance on the browser's implicit `content` element global with the explicit contentContainer reference.

## Performance and organization

- Render only the visible schedule/scores/leaderboard/lineup page. Opening a page renders current data. Hidden leaderboard refreshes are skipped. Background refreshes do not reset unsaved setup fields.
- Extracted score persistence into js/score-writer.js, statistics into js/match-stats.js, and the retained text-copy/group-merge menu into js/legacy-registration.js with its own stylesheet.
- Kept the legacy text signup menu at the user's explicit request, alongside current manual Flex sharing, roster management, schedule image sharing and opener controls. Removed only unreachable team-selection and image-preview modals, handlers and styles.
- Image sharing no longer retains the last PNG/object URL indefinitely. Download URLs expire after use; PNG conversion releases decoded bitmaps and canvas memory.
- Added an allowlisted LIFF mirror sync script, so server/admin-only JavaScript is not copied to the public registration app.
- The legacy text/merge module and its CSS load on first use, not on every page load. Comparing initial index/app CSS/app JavaScript plus the new required modules: **304,090 to 275,640 bytes**, about 9% fewer bytes. app.js changed from **181,157 to 152,105 bytes**. Deterministic gzip comparison for those initial assets: **60,426 to 57,309 bytes**. These are artifact measurements, not real-device loading timings; opening the legacy menu loads its separate assets.

## Verification

- **150 automated tests passed**, including legacy text copy/merge, multi-date saves, concurrent changes, retry/discard, stale Auth/roster reads, visible-page rendering, image cleanup, exact duration and preserved opener behavior.
- Real database compare-and-set smoke test passed in a rollback-only transaction: approved edits succeed, the timestamp advances, stale edits change zero rows, and saved scores remain intact. No fixture data persisted.
- All literal getElementById references in app.js resolve to static/generated IDs after removal. Edge bundle remains consistent with unchanged backend source.
- CI and deployment status must be checked for the published commit. Browser/device automation remains unavailable because of the bracketed Windows workspace path; real LINE/device interaction was not verified here.

Current privacy notice, 30-day retention job and collaborative LINE editing policy remain in place. SQL history and prior security reports are retained for audit and rollback purposes.
