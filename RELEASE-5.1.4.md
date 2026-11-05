# TK7 5.1.4 — matching player-summary sharing in LIFF

- Added **ส่งสรุปรายชื่อ / Share player summary** to the participant match card in LINE LIFF, regardless of whether a schedule exists.
- LIFF reads a fresh authenticated roster for the selected date, then previews the same shared text formatter used by the web administrator page. Each colour shows slots 1–7, preserving the actual slot positions and leaving vacant slots numbered and empty.
- Both summary dialogs now contain only the recipient-picker action and a close control. Removed the summary copy/refresh buttons as requested. The separate legacy text-copy/group-merge menu remains untouched.
- LINE recipient selection starts in the user's send click, after the roster read has finished. Opening a preview never sends. Failed reads, changed dates and unavailable LINE sharing cannot send a replacement/stale message. No bot or automatic sending is used.
- Updated the mirror sync allowlist to include roster-summary.js and synchronized web/LIFF displayed versions.

Validation: 160 automated tests, including 4 LIFF-specific summary tests and shared web/LIFF payload checks. No actual LINE recipients were selected or messaged during testing. Device UI/picker interaction remains unverified in this environment.
