# Changes and verification

- Added three locally compressed, muted perfume clips with preloaded crossfades, looping fallback playback, tab visibility handling and reduced-motion support.
- Reworked the main and about-page navigation as a black editorial bar with the supplied monogram at the left; replaced footer wordmarks with the monogram.
- Refined the translucent amber fill and kept its visible surface level as the bottle turns.
- Replaced the static homepage hero/product sections with a continuous five-chapter scroll story.
- Added a real local WebGL bottle with glass, amber liquid, cream wraparound label, burgundy cap and gold atomiser.
- Added scroll-controlled full turns, tilt, camera depth, cap lift, pump compression, projected mist and note reveals, plus replay and pointer parallax.
- Retained the original bottle image as a no-WebGL fallback and all original source assets.
- Added reduced-motion, mobile, offscreen-pause, hidden-tab-pause and context-loss handling.
- Fixed invisible CTA text caused by inherited light-page colours.
- Fixed missing-asset crashes for inherited object names and invalid JSON payloads incorrectly returning server errors.
- Fixed the build MIME map so JavaScript modules are served as JavaScript.
- Fixed Escape menu state/focus behaviour and the mobile header grid.
- Replaced raw fetch/JSON form errors with useful retry text; malformed success responses cannot clear the email or claim signup success.
- Preserved the production waitlist, database schema, unsubscribe flow, original Site ID, founder content and development disclaimers.
- Added production-Worker preview commands, focused tests and setup/design documentation.

The original Site cannot be accessed by this editing account; publication and live D1 integration are not claimed. Local persistence is tested with a temporary SQLite database, and browser form failures are verified against both mocked network failures and the real local Worker without a database.

Dependency audit: npm reports four moderate advisories in the pre-existing drizzle-kit / esbuild-kit development toolchain. Its suggested automatic fix is a breaking drizzle-kit downgrade; that unrelated migration-tool change was not applied. These development tools are not loaded by the shipped website or production Worker.
