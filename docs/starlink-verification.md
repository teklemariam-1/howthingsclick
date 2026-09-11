# Starlink delivery verification — 11 September 2026

## Films
| File | Dimensions | Frames | Rate | Duration | Size |
|---|---|---|---|---|---|
| HowThingsClick-Starlink-Short.mp4 | 1080 × 1920 | 1,800 | 30 fps | 60.000 s | 74,671,479 bytes |
| HowThingsClick-Starlink-Full.mp4 | 1920 × 1080 | 4,500 | 30 fps | 150.000 s | 172,830,412 bytes |

Both are H.264 MP4 visual masters. FFprobe confirmed frame counts, dimensions and duration. FFmpeg decoded both complete files with `-v error -xerror` and no errors. Contact sheets were inspected across both edits. The films have branding, chapter headings, technical labels and a final website invitation. They do not contain narration audio or burned narration captions.

Final copies and both narration packages are in:
`C:/Users/tekke/Videos/HowThingsClick-Starlink/`

The first real-time browser capture dropped frames. It was replaced by WebCodecs rendering every frame at explicit 30-fps timestamps, then local FFmpeg muxing. Use **Render smooth master** for this production path; ordinary **Record tour** depends on device/browser performance.

## Website and source
- Local page: http://localhost:3000/starlink
- Feature branch: codex/starlink-lab. Production main was not merged or deployed in this task.
- Eight interactive system views; orbit/zoom, assemble/disassemble, beam-angle control, obstruction toggle, direct/laser routing, 1×/1.5×/2× exploration speed.
- Separate 60-second portrait and 150-second landscape tours; chapter seeking; optional local voiceover import; narration and cue downloads.
- New homepage card and Space category; original Blender source preserved in source-assets/starlink.
- Existing engine, car and self-driving implementations retained.

## Checks
- TypeScript compilation.
- Scoped lint for Starlink and its additive slider accessibility support.
- Production static build includes /, /engine, /car, /self-driving and /starlink.
- Static collection, Space category, route, model, preview image and narration assets checked.
- Engine: 15 mechanics tests.
- Car: 279 assemblies / 675 meshes, finite geometry and assembly restoration.
- Self-driving: all six existing suites passed.
- Starlink: exact tour durations, deterministic sampling, phased-array steering, orbit/propagation calculations, line of sight and named GLB hardware assemblies.
- Desktop and mobile preview inspected. The model uses original, reference-informed geometry with NASA Earth textures. Hidden electronics, sizes and signal motion are educational illustrations, not SpaceX CAD or live network data.

