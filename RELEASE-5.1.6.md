# TK7 5.1.6

- Replaced the long privacy link/banner with a compact green privacy button on both web and LIFF. It opens the existing full notice, including data requests and retention information. Shared CSS keeps both controls consistent; keyboard focus remains visible.
- Web and LIFF player-summary forms close after LINE confirms successful sending, with a success message on the underlying page. Cancellation, login-only redirects and share failures keep the summary available for retry. LIFF does not close an unrelated sheet opened while sharing.
- No changes to shared names, Google Maps, numbered slots or the legacy copy menu.
- 162 automated tests pass, including successful closure and cancellation/failure behavior. Device visual checks remain unverified in this environment.
