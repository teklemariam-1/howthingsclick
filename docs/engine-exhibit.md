# Engine exhibit and recording workflow

The exhibit is a representative modern transverse inline-four petrol engine: two camshafts, 16 valves, a timing chain, port and direct fuel injection, and a wet sump. It contains 86 selectable engine assemblies, including an exposed coil rail and small fuel-pump acoustic insulator, cast aluminum chain housing, compact transaxle housing, fuel pressure pump, covers, gaskets, fastener groups, piston ring packs, wrist pins and bearing caps. The exterior and engine-bay packaging take their reference from the white Corolla LE supplied by the user (the listing identifies it as model year 2026). This is an original educational model, not Toyota CAD or an exact M20A-FKS replica. Internal transmission components are simplified.

## Explore

- **Engine bay** opens the hood and frames the engine, with a battery, fuse box, ECU, brake booster and reservoir, washer bottle, airbox, radiator/condenser, coolant hardware, wiring, hoses, mounts and transaxle. Supporting vehicle equipment provides context; it is not part of the selectable engine assembly registry.
- **Chassis** removes the bodywork and shows the floor, front subframe, suspension, steering rack, CV shafts, fuel tank and underfloor exhaust. A faint body outline preserves the car's shape.
- **Exterior** shows the white body, glazing, lights and cabin with a separate hood control. The body uses the brochure's 182.3 × 70.1 × 56.5 inch reference dimensions and 106.3 inch wheelbase. The 205/55 R16 tires have modeled tread, sidewalls, rims, lug bolts and brake discs. Interior packaging, overhang split, track and suspension geometry are representative. All share ten scene units per metre with the engine.
- Toggle **Car** for an engine close-up; system views hide the vehicle automatically. Wheels and CV shafts pause with the engine and during disassembly; brake calipers remain stationary. Motion is illustrative rather than a road-speed calculation.
- **Assemble** restores the complete exterior. **Disassemble** stages the separation of the assemblies; the slider lets visitors inspect intermediate positions. This is an exploded-view explanation, not a service procedure.
- **Moving parts** focuses on the synchronized mechanism, intake air, fuel, combustion and exhaust. Oil paths are kept in their dedicated section to reduce visual clutter. The colors are explanatory: cyan air, pink fuel, orange combustion, violet exhaust, gold oil and blue coolant.
- **Air, fuel & spark**, **Oil circulation** and **Cooling circuit** isolate the corresponding systems visually. Cold/warm cooling changes the bypass/radiator routes.
- The cycle spans 720 crankshaft degrees. Valve events are idealized without overlap. Port injection follows the intake stroke; direct injection uses an illustrative late-intake/compression window. The throttle changes butterfly opening and flow speed; it is independent of slow-motion playback and does not calculate RPM, torque or horsepower. Production variable valve timing, injection strategies and Toyota's electric water pump are not simulated.

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

Reference principles: [US Department of Energy](https://www.energy.gov/cmei/vehicles/articles/internal-combustion-engine-basics), [Bosch port injection](https://www.bosch-mobility.com/en/solutions/powertrain/gasoline/gasoline-port-fuel-injection/), [Toyota Dynamic Force engine](https://global.toyota/en/mobility/tnga/powertrain2018/engine/) and [2025 Corolla brochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/corolla_ebrochure.pdf). User-provided presentation reference: [Animagraffs — How a Car Engine Works](https://www.youtube.com/watch?v=ZQvfHyfgBtA). No reference video assets or narration were copied. Geometry, textures, tours and recordings run locally in the browser without a paid API.

## Corolla LE visual references

- [User supplied EchoPark listing](https://www.echopark.com/car/5YFB4MDE5TP453292): white 2026 Corolla LE; body silhouette, window openings, lamps, horizontal grille and wheel covers.
- [Toyota 2026 Corolla brochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2026/corolla_ebrochure.pdf): LE 16-inch wheels and 205/55 R16 tires.
- [Toyota dealer engine-bay photograph](https://www.edmartintoyota.com/assets/stock/expanded/transparent/1280/2026toc04_1280/2026toc042038832_1280_25.png): exposed coils, black cam cover, fuel-pump insulator, right-side battery/airbox and broad intake snorkel.

The shell is original parametric geometry with a separate hinged hood, not a mesh extracted from the photographic 360-degree viewer. The model is visually guided by these references; engine dimensions, internal valve events and accessory routing remain representative rather than service-grade Toyota CAD. No dealer images are shipped as application assets.

The exterior revision uses a [Toyota-rendered LE side view](https://www.liptontoyota.com/inventory/new-2025-toyota-corolla-le-front-wheel-drive-le-5yfb4mde7sp13c082/) to align the windshield, cabin, roof and rear quarter relative to the axle centres. The bumper and lamp apertures share a curved surface; reflector modules sit inside the recesses. The hood reinforcements follow the revised hood skin, and the cowl and frame members fit within the body. Exterior labels remain hidden while the hood is closed to keep the silhouette unobstructed. Shadow coverage adapts between the whole car and the focused engine.
