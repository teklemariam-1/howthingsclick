# Engine exhibit and recording workflow

The exhibit is a representative inline-four petrol engine: two camshafts, 16 valves, port fuel injection and a wet sump. It contains 82 selectable assemblies, including covers, gaskets, fastener groups, piston ring packs, wrist pins and main/rod bearing caps. The radiator and intake accessories are included; the transmission and vehicle fuel tank are outside this exhibit.

## Explore

- **Car** shows a faint sedan outline with four rotating wheels, placing the detailed engine in its front compartment. Toggle it for an engine close-up; system views hide the outline automatically. Wheels pause with the engine and during disassembly. This is contextual motion, not a transmission or road-speed simulation.
- **Assemble** restores the complete exterior. **Disassemble** stages the separation of the assemblies; the slider lets visitors inspect intermediate positions. This is an exploded-view explanation, not a service procedure.
- **Moving parts** focuses on the synchronized mechanism, intake air, fuel, combustion and exhaust. Oil paths are kept in their dedicated section to reduce visual clutter. The colors are explanatory: cyan air, pink fuel, orange combustion, violet exhaust, gold oil and blue coolant.
- **Air, fuel & spark**, **Oil circulation** and **Cooling circuit** isolate the corresponding systems visually. Cold/warm cooling changes the bypass/radiator routes.
- The cycle spans 720 crankshaft degrees. Valve events are idealized without overlap. The throttle changes butterfly opening and illustrative flow speed; it is independent of the slow-motion playback speed and does not calculate RPM, torque or horsepower.

## One timeline for the website and video

`lib/engine/tour.ts` is the source of the shot sequence, narration, duration and caption exports. The full tour is 100 seconds; the teaser is 63 seconds and ends with an invitation to use the live controls. Update these shots and their scene directions together when authoring a new exhibit.

The visitor can pause, scrub, select chapters or take control. Audio is off by default. Device narration uses the browser's speech service only after an explicit toggle; it is not part of the recorded video.

For a YouTube edit:

1. Select full tour or teaser and click **Record tour**. The browser records the same 3D sequence locally, without microphone access. The composite is 1600 × 900; the capture stream requests 30 fps. Actual frame rate depends on the device.
2. Save the video. WebM is preferred; MP4 is used when it is the available supported format.
3. Download **Script** for a professional narration track and **Captions** for the matching SRT. Add the voice track in an editor. No ElevenLabs integration, paid request or upload is performed by this exhibit.
4. Keep the tab visible for a clean recording. Manual chapter jumps and scrubbing are disabled during capture.

## Geometry and validation

All geometry is generated locally. PBR materials, cast surface grain, bevels, springs, sealing faces, cam profiles and a combustion shader improve visual detail. This is an educational real-time model, not a manufacturer's measured CAD assembly or a calibrated fluid/thermodynamic simulation. The flow paths and flame front are illustrative.

Static surfaces are merged within their moving groups to reduce draw calls while preserving selection and animation pivots. Reduced-motion mode starts paused. All scene resources and capture tracks are released on teardown.

Automated mechanics checks cover rod length, piston travel, firing order, periodic seeking, valve events/clearance, flow gating, complete reversible separation, the part registry and tour boundaries. Browser review covers assembly, system views, throttle interaction, tour controls, caption download, the 390 px layout, and video capture/playback.

Reference principles: [US Department of Energy](https://www.energy.gov/cmei/vehicles/articles/internal-combustion-engine-basics), [Bosch port injection](https://www.bosch-mobility.com/en/solutions/powertrain/gasoline/gasoline-port-fuel-injection/). User-provided presentation reference: [Animagraffs — How a Car Engine Works](https://www.youtube.com/watch?v=ZQvfHyfgBtA). No reference video assets or narration were copied.
