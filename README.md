# H.AARONS — RHAPSODY

An immersive, native-scroll fragrance website. This is the H.AARONS vanilla HTML/CSS/JavaScript and Cloudflare Worker project supplied for this task; it is not a Kairos monorepo.

## Preview

Node.js 22.13+ is required for the SQLite test harness.

```sh
npm ci
npm run dev
```

Open http://localhost:8766. Re-run `npm run build` after editing files; refresh the browser. The preview uses the packaged production Worker, including the production Content Security Policy and correct module MIME types.

For a quick visual-only preview, the `public` folder can also be served with a static HTTP server. The launch-list API needs the Cloudflare Worker and its D1 binding. The local Worker preview deliberately has no production database and returns a retryable error on signup. It never fabricates a successful registration.

## The experience

- The supplied bottle opening film runs behind the story. Scroll moves through its frames in either direction, from the closed bottle to the ingredients in the amber liquid.
- If the film fails to load, the Three.js bottle takes over. The supplied product photograph covers browsers without WebGL and stays still for reduced motion.
- The opening can be revisited from the revelation chapter. The text is readable without JavaScript.
- The black navigation uses the supplied gold monogram at the left; the footer uses the same emblem.
- Rendering pauses offscreen and in hidden tabs. Pixel density, transmission resolution and frame rate are capped for phones.
- The founder, story, FAQ, privacy, signup and unsubscribe pages retain the supplied product facts. RHAPSODY remains in development; there is no invented release date, price, preorder or checkout.

## Checks

```sh
npm test
npx playwright install chromium webkit
npm run dev
# In another terminal:
npm run test:browser
BROWSER=webkit npm run test:browser
```

Unit checks cover reversible scroll choreography, bounds, reduced motion, module serving and missing database behaviour. The existing SQLite-backed waitlist checks cover persistence, duplicate handling, validation, consent, cross-origin requests, honeypots and removal. Browser checks cover real 3D initialization, scroll/replay, focus, error recovery, responsive layout, reduced motion, WebGL fallback and no-JavaScript content.

## Files

- `public/index.html`, `journey.css`, `journey.js`: story composition and interaction.
- `public/journey-model.mjs`: pure scroll choreography.
- `public/bottle-3d.js`: model, lighting, camera, rendering lifecycle and projected spray origin.
- `public/liquid-macro.js`: the 3D view inside the bottle.
- `public/scroll-film.js`: maps chapter progress to frames in the supplied clip.
- `public/assets/videos/rhapsody-scroll.mp4`: the muted film used for scroll playback.
- `public/vendor`: pinned local Three.js runtime and MIT license. These local files keep the existing self-only script policy intact. Version is also recorded in `package.json` / lockfile.
- `public/script.js`: menu and honest launch-list feedback.
- `worker/`, `db/`, `drizzle/`: original waitlist service and persistence.
- `scripts/build.mjs`: packages the production Worker and its static assets.
- `.openai/hosting.json`: original Site identity and D1 binding, preserved.

## Hosting

The original Site project is not accessible from the account used for this edit. No replacement Site was created and no live publication was changed. Import this source into the original authorised Site workflow, retain its D1 binding and run `npm run build` before publication. The local preview and source ZIP are the deliverables; live waitlist integration requires verification in that authorised environment.

## Design references

The supplied brand assets and animation reference remain canonical. The linked scroll-world repository was inspected for scroll-story structure. UI/UX Pro Max informed responsive/accessible interaction and the 3D performance review. OpenDesign's motion-design guidance informed continuity, anticipation, readable holds and the central reveal. Their paid image/video services and application runtimes are not required by this website.
