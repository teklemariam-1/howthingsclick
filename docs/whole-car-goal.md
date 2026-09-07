# Whole Corolla exhibit — active implementation

The requested end state is a realistic and accurate Corolla exterior and a whole-car exhibit with assembly, disassembly, identification and inspection of the car's parts, alongside the existing engine exhibit. This is not complete merely because a whole-car explode button exists.

## Evidence and requirements

- Exterior: compare front, rear, both sides and three-quarter views against the exact EchoPark listing and user screenshots. Correct panel outlines, glazing, wheel covers, fascia and lighting details; preserve the assembled silhouette when splitting parts.
- Structure: individually separable hood, four doors, glazing, mirrors, front fenders, quarters, roof, trunk, bumpers, grilles and lights, with believable inner structure exposed during removal.
- Cabin: seats, rails, head restraints, dashboard, console, steering controls, door trim, glazing mechanisms, restraints, headliner and luggage compartment components.
- Running gear: LE MacPherson front struts, **torsion-beam rear suspension**, coils, dampers, steering rack, control arms, hubs, wheels, tires, covers, fasteners, discs, calipers and brake hydraulics. Toyota's US 2025 brochure explicitly distinguishes LE torsion beam from SE/XSE multi-link.
- Powertrain and services: current engine lab, transmission/final drive, half shafts, mounts, intake, cooling, A/C, battery, electrical distribution and harnesses, fuel storage/delivery and exhaust.
- Interaction: whole-car and per-part reversible assembly, staging, filtering, searchable part descriptions, focus/isolation, accessible controls, responsive layout and inspection from all angles.
- Presentation: preserve engine tours/recording; add a coherent whole-car tour and recording path before completion.
- Verification: prove each registered assembly has renderable geometry, unique identity and valid description; inspect rest/exploded positions and exact restoration, all controls, keyboard/mobile usability, runtime errors and visual fidelity. Keep the full goal active until the complete requested state is reviewed.

Source: https://www.toyota.com/content/dam/toyota/brochures/pdf/2025/corolla_ebrochure.pdf . Dimensions and system layouts are checked against Toyota references. Procedural geometry is not factory CAD; unverified geometry remains an outstanding fidelity issue, not evidence of exactness.

## Whole-car implementation checkpoint

- The home page is now the whole-car explorer. `/engine` preserves the original detailed engine exhibit; `/car` is an alias for the car view.
- 174 registered car assemblies plus the engine module: body panels, glazing, cabin, door hardware, wheel components, suspension, fuel/exhaust, electrical equipment and a separable transmission layout.
- Eight system filters, text search, part descriptions, focus, isolation, staged disassembly, per-part removal/return, assembly slider and directional cameras.
- A silent 62-second car tour shares its shot data with canvas recording, captions and an exported narration script.
- Model tests check finite geometry, unique IDs, complete mesh ownership, nested isolation, stage order, individual return overrides and exact restoration. Run `node scripts/test-vehicle.mjs`.
- Browser review found and fixed spline overshoot around door outlines and roof trim protruding through the exterior. The latest front/rear/side/quarter renders remain approximate, especially lamp optics, bumper corner surfacing and wheel-cover sculpture.
- Transmission functional reference: https://global.toyota/en/mobility/tnga/powertrain2018/cvt/index.html . Its pulley/belt and launch-gear paths are represented, but casing dimensions and internal placements are not measured factory CAD.
- Still required before the full goal is complete: further exterior matching, curved inner body surfaces and luggage tub, more accurate panel boundaries at the rear lamps/trunk, complete cooling/HVAC separation from the engine module, and a visual/mechanical review of the newly exposed hardware. Do not treat the assembly count as a claim that every production fastener and internal component has been modeled.

Verified for this checkpoint: model tests passed for 174 car assemblies / 395 meshes; whole-car browser checks passed on desktop and 390 px mobile with no page errors; keyboard assembly and individual return overrides passed; a 1600×900 WebM recording (692,346 bytes in the short check), SRT download, tour replay and navigation to/from the engine lab passed. Existing engine assembly, hood, combustion flows and oil-only separation checks passed.

## Exterior and service separation revision

- 178 body/chassis/cabin assemblies, four independently removable engine-bay service assemblies, and the engine module: 183 selectable assemblies in the car explorer.
- The actual detachable trunk surface now follows the curved visible shut line. Inner rear lamps follow the lid; outer lamps and quarter-panel shoulders stay with the body. UV partition tests check area conservation and reversed winding.
- Headlamps have recessed optical housings, projector lenses and removable clear covers. The tapered side profile and grille slat/band layout were revised against the exact front and side photos. Wheel covers have sculpted paired vanes and a raised centre emblem.
- Radiator/fan, coolant hoses, expansion reservoir and air cleaner use independent car-mode transforms/materials while preserving their original engine-lab counterparts. The simplified engine-lab transmission is hidden when the detailed vehicle CVT is shown.
- Fixed the Perspective button retaining the previously selected viewing direction; added overhead camera clearance for the controls.
- Browser checks passed for whole-car controls, independent radiator removal/return, trunk and engine removal, mobile layout, engine flows, tour recording and caption export. Short recording check produced a 954,588-byte WebM. Material/transform independence and nested trunk-lamp motion are covered by model tests.
- Remaining fidelity work: bumper/quarter curvature, mirror and glazing profiles, detailed inner trunk/body stampings, cabin/HVAC geometry and mechanically verified hidden connections. The exterior remains a procedural approximation; the photographs are not sufficient evidence to claim a factory-exact model. The full goal remains active.


## Cabin, luggage compartment and referenced suspension revision

- 255 vehicle assemblies plus four independent engine-bay service groups and the engine module: **260 selectable assemblies**. This is a service/explanation breakdown, not a claim to include every production fastener.
- Rebuilt the two-tone cabin around the supplied photo and Toyota manual: shaped seat pads/backrests, stitched cloth, separate restraints/rails, dashboard, cluster, centre display, climate controls, steering wheel/airbag, pedals, recessed cup holders, glovebox bin and door trim with real edge thickness.
- Added separable heater/evaporator units, blower, filter/tray/cover, ducts, support beam and cabin wiring. The Toyota manual's engine-bay drawing also prompted a second fuse enclosure and removable cover.
- Interior inspection now removes obstructing near-side and roof trim; selecting those parts still restores them. This is an inspection cutaway, not an alternative physical assembly state.
- The trunk lid opens on its hinge motion, carrying its frame, lining, latch and inner lamps. Added luggage floor/spare well, compact spare, clamp, tool tray and jack, liners, wheel housings, seal, sill, striker, fixed brackets and rear body structure. Bumper reflectors follow their own detachable bumper.
- Replaced front control-arm rods and block knuckles with profiles based on a visually inspected exploded parts diagram. Added distinct bushings, lower ball joints and hollow hub bearings; aligned the coil springs to the dampers and added spring seats/bellows.
- Toyota owner-manual diagrams were directly inspected for the dashboard (p. 16), engine bay (p. 298) and removable cabin-filter tray (p. 326). See the separate reference register for links and the distinction between inspected diagrams and inaccessible catalog artwork.
- Validation: finite geometry, identity/ownership, independent nested parts, closure motion and exact reassembly model checks; browser cabin/trunk/assembly/mobile checks; original engine flows with oil excluded from Moving Parts; keyboard controls, tour replay, captions and short WebM recording. The latter recording produced 676,418 bytes before the final suspension contours were added; the final suspension has its own visual/interaction check.
- Remaining: trim and upholstery surfaces still look procedural; overall exterior, engine castings, rear stampings, HVAC cases and exact hidden hose/harness connections are not factory CAD. Refrigerant plumbing has not been verified end-to-end. These limits remain material to the user's requested realism, so the full goal stays active.
