# How Starlink actually works — production plan
Branch: codex/starlink-lab. Original interactive 3D scene for /starlink, with 60-second vertical and 150-second landscape edits. Existing engine, car and self-driving implementations stay intact.

## Creative direction and pace
A premium orbital documentary: photographic NASA Earth, deep black space, physical silver/graphite hardware, electric cyan radio, warm gold optical links, lime return packets. Strong silhouette, atmospheric Earth rim, directional sunlight, atmospheric scattering and restrained signal glow. Original Blender models supply repeatable geometry and real camera parallax; images are reference/texture inputs, not slideshow frames. Detailed materials and modeling are the goal; this is a reference-informed reconstruction, not manufacturer CAD.

The hook begins immediately: a visible radio packet path connects Earth to a satellite, with a three-second camera push. Develop the picture every 2–4 seconds. Major scenes are 6–17 seconds with close-up camera moves, animated signal flow or an assembly transition throughout. Ease camera motion over about 0.8 seconds rather than long, slow reveals. Pause and orbit are available in the interactive version. The 60-second Short is composed for 9:16, not cropped from the 16:9 edit.

## Full film — 150 seconds
| Time | Scene | Action / camera | Learning point |
|---|---|---|---|
| 00:00–00:09 | Hook | Satellite silhouette, illuminated Earth, request packet races upward | Internet in motion overhead |
| 00:09–00:21 | Your terminal | Push from an outdoor terminal into its thin surface; router and cable are visible | Dish uses radio; router provides local Wi-Fi |
| 00:21–00:38 | Beam steering | Radome peels away, phased-array tiles glow in sequence, beam changes direction | Timing changes steer a beam without turning the dish |
| 00:38–00:50 | Low Earth orbit | Pull out to actual-radius Earth diagram; follow a moving link | Shorter distance helps latency; altitude varies |
| 00:50–01:06 | Inside the satellite | Antenna face separates, compute layer revealed, solar wings stay visible | Radio payload, onboard routing, power and optical links |
| 01:06–01:22 | Laser backbone | Gold point-to-point links build between three moving satellites | Some traffic crosses space before returning to ground |
| 01:22–01:35 | Back to the internet | Gateway dishes, fiber path, server, a returning lime packet | Ground infrastructure still connects to internet services |
| 01:35–01:52 | Handoff | Incoming satellite takes over the cyan link as the old link fades | Moving satellites require changing connections |
| 01:52–02:08 | Obstructions | Tree interrupts one beam; the blocked link stops at the obstruction | Clear sky matters; laser links do not fix a blocked user terminal |
| 02:08–02:20 | Complete round trip | Request and response traverse home, orbit, gateway and server | It is a network, not a satellite containing the whole internet |
| 02:20–02:30 | Explore | Clean hero orbit and website CTA | Invite viewer to steer the beam and test an obstruction |

## Short — exactly 60 seconds
00:00–00:05 hook; 00:05–00:12 terminal; 00:12–00:22 beam steering; 00:22–00:31 satellite cutaway; 00:31–00:40 lasers; 00:40–00:47 gateway; 00:47–00:55 handoff; 00:55–01:00 interactive CTA.
Portrait-safe hardware framing, larger labels, no important detail behind Shorts' bottom/right interface. No long intro or subscribe bumper.

## Asset production
1. Collect official Standard 4 X specification drawings and Starlink satellite photography. Use reference photographs for modeling; do not redistribute them by default.
2. Model original V2-Mini-inspired bus with rounded machined edges, antenna face, optical apertures, thermal blanket, avionics boards, power hardware, harnesses, two articulated photovoltaic wings and thruster detail. Proportions are reference-informed, not engineering specifications.
3. Model the Standard 4 X terminal using published 594 × 383 × 39.7 mm dimensions, kickstand, seal, rear cable port. Hidden board layout is illustrative; no invented exact antenna-element count.
4. Export named GLB parts with independent assembly groups. The same assets support close-ups, exploded views, orbiting and both recording formats.
5. NASA Earth day and night maps; original procedural panel/metal details. Keep asset attribution in public/licenses and a source inventory.

## Interactive behavior
Scene buttons: Overview, Terminal, Beam steering, Satellite, Laser links, Gateway, Handoff, Obstructions. Drag to orbit; scroll to zoom; reset camera; assemble/explode satellite or terminal. Beam-angle slider, alternate ground/laser route, clear/blocked sky and playback speed. A timeline scrubs to deterministic scene states; guided tour temporarily controls the camera.

## Engineering and truthfulness
Radio links to a terminal/gateway differ from optical links between satellites. The modern flat terminal electronically steers; its kickstand is manually oriented, not an animated tracking motor. Show a representative orbit and label it illustrative; official 2026 shell lowering means no universal 550 km claim. Orbital speed uses circular-orbit physics. Numerical path delay is propagation-only, not promised end-to-end latency. Phased-array visualization is a normalized teaching array, not a reconstruction of proprietary electronics. Packet speed, satellite size and orbit playback are exaggerated for visibility; diagrams state this. Avoid satellite counts, subscription speed promises and latency guarantees that rapidly become stale.

## Export and narration
One shared scene/tour definition powers interactive playback and recording. Export at 1920×1080 (150 s) and 1080×1920 (60 s), 30 fps. Branded video frame; no baked narration captions. Download timed narration, plain voice script and cue sheet for each duration. Optional local voice-over import; no paid API dependency. Videos are generated from the actual 3D scene and reviewed at key transitions and both aspect ratios. Where a voice track is not supplied, label visual masters accurately rather than claiming finished human narration.

## Validation / delivery
Check model assets, WebGL render, all scene controls, replay/scrubbing, camera framing, assembly restore, short/full timings, stream stop and playable download. Build all five routes and run existing engine/car/self-driving checks once before delivery. Review extracted video frames, media duration/dimensions and full decode. Save source, scripts, editable Blender scene, reference inventory and final MP4s. Keep this feature branch reviewable; do not merge to production as part of animation authoring.

## Primary references
- https://www.starlink.com/technology
- https://www.starlink.com/public-files/specification_sheet_standard.pdf
- https://space-safety.starlink.com/docs/space-safety-articles/constellation_altitudes/
- https://www.starlink.com/public-files/starlinkProgressReport_2024.pdf
- https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/
- https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/
Research checked 11 September 2026.

