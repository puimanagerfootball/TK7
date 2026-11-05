# TK7 5.1.3 — share registered player summary

- Added **ส่งสรุปรายชื่อ** beside the registration share button on the web administration page. It is available for an existing registration date, including closed registration.
- Opening the summary refreshes the authenticated roster first. The preview groups actual names by shirt colour/slot and includes the match date, kickoff, total players/teams, registration status and registration link. Open dates link to their roster; closed dates link to the registration home because closed dates are not listed in the participant date picker. Account IDs, group IDs and tokens are excluded.
- The user checks the preview, then chooses LINE recipients explicitly or copies the text. The LINE picker runs directly in the send button gesture; no roster request is awaited before it. There is no bot or automatic sending.
- Preview text is a snapshot. Refresh it again if registrations changed while it was open. Failed reads and changed dates/permissions cannot send an unverified or wrong-day summary. Closing the preview clears its text.
- The legacy text-copy/group-merge menu and normal Flex registration sharing remain available.
- Both web and LIFF display 5.1.3. The summary button is on the web admin page; no database or Edge deployment is required.

Verification: 156 automated tests, including 6 new summary/recipient-picker tests. Existing max-size roster (70 names, 40 characters each) fits the LINE text message limit. Tests use mocked recipients and never send a real LINE message. Real phone/desktop picker interaction remains a device check.

API reference: [LINE shareTargetPicker](https://developers.line.biz/en/reference/liff/#share-target-picker).
