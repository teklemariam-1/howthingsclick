# Rocket recovery lab
Status: implemented locally on codex/rocket-recovery-lab; no deployment requested for this pass.

## Scope and sequence
1. Original physically based Three.js hardware: Falcon 9 first stage (nine Merlin bells, four grid fins, four deployable legs), and Super Heavy in the Flight 5-era configuration (four fins, 33 bells, two catch interfaces).
2. Separate environments: ocean drone ship and coastal launch/catch tower. Realistic proportions, trusses, handrails, rail-supported catch arms, weld rings, plumbing and thermal wear. No downloaded third-party model dependencies.
3. Recovery playback, timeline scrubbing, orbit/pan/zoom, hardware isolation/exploded view, fin/leg/arm controls, click-to-inspect, labels.
4. Landing challenge: a deterministic reduced-order simulation with gravity, propellant loss, thrust limits, lateral wind, guidance and contact criteria. Auto/manual ignition; wind slider; recoverable success and failure. All numeric readouts are educational model values, not SpaceX telemetry.
5. One 60-second 1080x1920 Short with eight authored shots. Fast opening, useful changes every 5–9 seconds. Brand mark only; narration captions off by default. Optional local audio import, real-time browser recording, downloadable timecoded narration and Helio prompt.
6. Homepage entry, static route, sources/methodology, scoped styles and route isolation.
7. Verify control dynamics, frame/tour timing, contact geometry, build, existing suites, browser desktop/mobile and recording.

## Accuracy
- Tower catch concerns the Super Heavy first-stage booster, not a claim that the Starship upper stage was caught.
- Explicit Flight 5-era illustrative configuration; do not combine the newer three-grid-fin booster with older hardware.
- Falcon 9 drone-ship example does not depict every mission making a boostback burn.
- Atmospheric fins change aerodynamic forces; engine gimbal redirects thrust. Thrusters act outside substantial atmosphere. These are distinct mechanisms.
- Tower arms support the booster's catch interfaces; they do not squeeze the tank barrel or catch it by its fins.
- Simulation starts in the final approach. It is not a CFD solver or reconstruction of a particular mission's telemetry.
- Fire, flow, timing, clearances and particle scale may be enhanced to be readable on phones.
- Audio off until a user explicitly plays a selected track. No automatic narration. No copyrighted video footage incorporated.

## References accessed 2026-09-11
- https://new.spacex.com/vehicles/falcon-9
- https://www.spacex.com/assets/media/falcon-users-guide-2025-05-09.pdf
- https://www.spacex.com/vehicles/starship/assets/media/Starbase%20Overview.pdf
- https://www.youtube.com/watch?v=CMGiNKcVSek (official SpaceX Flight 6 description; catch abort and divert)
- https://new.spacex.com/updates (configuration changes, booster relight)
- https://www.spacex.com/vehicles/starship/

## Realism and film review
- Added a NASA-textured Earth overview with recovery-site markers, a USGS Boca Chica aerial base, and modeled foreground tank farm, service buildings, launch mount and tower.
- Corrected the full Falcon 9 hinge trajectory: stowed and deployed angles now travel through the outward half-circle, so legs never sweep through the booster. Foot pads counter-rotate to sit flat on the deck.
- Geometry checks cover 101 analytical deployment poses and 41 poses of the actual rendered model. Landing pads meet the deck; opposite feet balance around the booster.
- Nozzle chambers, turbopumps, feed plumbing and cooling bands, weathered Falcon skin, reflective steel, sky lighting and tapered animated exhaust improve the close-ups.
- The Short opens close to the catch, briefly establishes Earth, alternates mechanism views, pushes toward the catch interface and ends with the interactive invitation. The renderer encodes 1,800 deterministic frames at 1080 x 1920 / 30 fps.
- The browser recording path requests canvas frames explicitly and prefers VP9 WebM for reliability. The production script exports H.264 MP4. Audio remains optional and local.
- This remains an educational 3D reconstruction with procedural hardware and historical geographic imagery. It is not photogrammetry, flight telemetry or a survey of the present-day Starbase site.

- Removed the exploded engine effect from every Short shot. Engines pivot at their upper attachment while powered; manual separation is a static, exhaust-off inspection. Regression checks keep the attachment fixed across the gimbal range and require zero explosion throughout all 1,800 tour frames.

- Rebuilt Falcon 9 legs after comparing the SpaceX LZ-1 photograph (https://www.flickr.com/photos/spacexphotos/24068507662): shorter 8.4 m main panels, a lower 1.25 m local hinge, and separate telescoping braces. These are reconstructed model dimensions, not asserted SpaceX engineering specifications. The calculated footprint is approximately 18.25 m across opposite foot centres. Shared geometry constants keep the rendered panels and contact checks aligned.
