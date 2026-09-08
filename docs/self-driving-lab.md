# Self-driving engineering lab

Route: /self-driving. Branch: codex/self-driving-cybercab, based on main at 24c84d4.

## Experience
The initial workspace is an engineering cutaway. Visitors can select cameras, onboard computing, perception, prediction/planning, controls, or power. A selected module gets a camera close-up; mesh selection works as an alternative to the keyboard-accessible system buttons.

Exterior, cutaway and exploded modes preserve the same moving assemblies. The Interior view opens the doors and frames the two-seat cabin, with shaped ivory cushions, headrests, seat belts, center armrest/cupholders, door inserts, slim dashboard and an original illustrative ride display. The computer's thermal cover lifts to reveal an illustrative PCB. Camera-data, command and feedback routes animate with the simulation clock. Aero covers hide in the cutaway to reveal complete split-spoke rims, hubs and brake rotors. The road tires have broad tread crowns, circumferential grooves and recessed sipes; the illustrative tire dimensions are modeling parameters, not OEM specifications. A virtual instrument in the 3D scene shows geometry-derived observations and trajectory/control readouts and appears in recordings too.

Three road tests provide inputs to the hardware explanation: an occluded pedestrian, traffic signals, and a clear adjacent lane around a closure. Timing, speed, layers, timeline, pause, and replay are adjustable. A separate processing-delay experiment uses constant-deceleration stopping-distance mathematics; it is explicitly independent of the street controller.

The four-minute tour focuses first on the engineering, then demonstrates it on the road. Local 1080p recording includes branding and technical instrument/part labels, without narration captions. Audio is optional, local and off by default.

## Accuracy and boundaries
This is an original educational reconstruction, not factory CAD or a certified vehicle model. Tesla's reference guide supports the floor-mounted 400 V battery, 48 V low-voltage system, and front drive unit containing the inverter. Individual PCB components, sensor count, detailed actuator packaging, wire routes, thermal circuits and manufacturing geometry are illustrative.

The software uses deterministic geometry, an occlusion test, constant-velocity extrapolation, explicit route/speed rules, and an illustrative speed controller. Front-wheel angle derives from path curvature using a kinematic bicycle relation. These are teaching algorithms, not Tesla's production stack. A real end-to-end network may combine functions shown separately here. No neural network is executed in the browser. Vehicle pose comes from simulated coordinates, not a real localization estimator.

The street controller's simplified stop clamp is not a validated braking model. The separate delay experiment assumes instantaneous constant deceleration after the selected delay, with no tire, weather or drag model. Night lighting does not alter perception.

## Blender and assets
Blender 5.2.1 is installed. scripts/blender/create-cybercab.py creates original compound-curved panels, glazing and shaped fenders, applies thickness/edge modifiers and exports public/models/cybercab-body.glb. Eleven named meshes replace matching surfaces; additional seals, pillars, wheel-well liners and lighting attach to the body or door assemblies through exported metadata. The Three.js door hinges, cutaway transitions and brake-light response are preserved. An initial procedural fallback remains available if the file cannot load.

Rebuild the original display using scripts/blender/create-cabin-screen.py with Python/Pillow, then run node scripts/blender/export-reference.mjs and Blender --background --python scripts/blender/create-cybercab.py. The main generator calls scripts/blender/cybercab_interior.py for the cabin. The repeatable modeling source is the Python script. Its editable scene is work/cybercab-surface-study.blend, including studio lights and a camera. Front, rear and side inspection renders are written to work/cybercab-*-v2.png (all ignored by Git). Use --quick for a single front render or --no-render to export the assets and editable scene without rendering. Run scripts/blender/inspect-wheel.py with Blender in background mode to inspect the wheel beneath its aero cover. scripts/blender/inspect-cabin.py renders the revised rear and two cabin angles. Rear fascia height and the larger black bumper base were matched visually to Tesla's photo references; these are not measured factory dimensions. Reference photographs informed the model and are not redistributed. A more exact exterior still requires further reference matching; this is not presented as a photogrammetric replica.

## Sources
- Tesla Cybercab emergency response guide, version 002, September 3, 2026: https://digitalassets.tesla.com/tesla-contents/image/upload/2026-cybercab-emergency-response-guide.pdf
- Tesla AI and Robotics: https://www.tesla.com/AI
- Tesla rider guide overview: https://www.tesla.com/robotaxi/riderguides/cybercab/en_us/GUID-669E83C2-E7DE-40F4-9DBD-C9A32E7F6DFF.html
- Tesla dimensions: https://www.tesla.com/robotaxi/riderguides/cybercab/en_us/GUID-3229BCDF-16D8-447B-BCED-77E3E067AFBB.html
- Tesla Japan reference imagery: https://prtimes.jp/main/html/rd/p/000000074.000038481.html
- Petersen reference exhibit: https://www.petersen.org/vehicle-spotlights/2024-tesla-cybercab-prototype
- Autoware architecture, including end-to-end alternatives: https://autowarefoundation.github.io/autoware-documentation/1.5.0/design/autoware-architecture-v2/roadmap/autonomous-driving-stack-architecture/
- Autoware feedback control: https://autowarefoundation.gitlab.io/autoware.auto/AutowareAuto/controller-design.html

## Recording and deployment
Keep the recording tab visible; hiding it pauses playback. MP4 is preferred when supported, with WebM fallback. A supplied audio file does not retime the tour automatically: record each script chapter into its allocated slot. Technical labels and virtual instruments are intentional; narration captions are not burned into the export.

No paid API, external inference or application backend is required. Assets and the simulation run in the visitor's browser. The Vercel build validates the new route. Feature work is kept separate from the engine, car and unrelated marketing files.
