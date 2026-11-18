# RHAPSODY design and motion

Use the supplied H.AARONS bottle, label, naming and product facts as brand reference. The procedural 3D bottle interprets the supplied shape and materials; it is not a manufacturing CAD asset.

The palette is warm charcoal (#171412), ivory (#faf5ec), copper (#e4b596), burgundy lacquer and amber liquid. Cormorant Garamond/Georgia supplies the editorial display type; Manrope/Arial supplies interface copy. Keep the background restrained, headlines spacious and controls explicit.

The supplied bottle film fills the sticky stage. Scroll position determines which frame you see. The closed bottle opens as you enter the story, then the camera moves through the liquid to the ingredient shots. Scrolling upward runs through the same frames in reverse. If the video cannot load, the procedural bottle carries the story.

Use native scrolling and navigable hash targets. Do not add an intro gate or scroll interception. Keep all story copy in DOM reading order, with a single h1 and labelled h2 sections. The canvas is decorative and hidden from assistive technology. Render only while visible, bound GPU resolution and particles, and never create meshes or textures per frame. The supplied photograph must remain available if WebGL fails.

Respect prefers-reduced-motion: no orbit, parallax, cap movement, spray or blur; notes are readable immediately. Mobile stacks copy above the bottle and uses compact chapter navigation. Menu, replay, chapter links, forms and focus states remain keyboard accessible. Product claims remain explicit about development status.


Keep the film muted. Use dark gradients around the copy and crop around the bottle on smaller screens. Reduced motion uses the still bottle. The black header places the supplied monogram left of the navigation. The footer uses the same emblem.
