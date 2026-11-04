# Release requirements

- The user requires TK7 and LINE LIFF to display the same version on every update.
- Run `node scripts/release-version.mjs <new-version>` before publishing. This updates both displayed versions and asset cache keys, and copies the web stylesheet used for LIFF schedule images.
- Publish both GitHub Pages and the existing LINE LIFF Sites mirror when browser assets or versions change. Include new browser dependencies in the mirror.
- Schedule images use the real web stylesheet and export layout. Keep the native image sharing, clipboard and download behavior consistent with the main website.
