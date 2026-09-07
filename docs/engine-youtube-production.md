# Engine episode production

The engine film uses the same interactive 3D scene as the site. No live voice API or media upload is needed by the viewer.

## First episode

- Main film: 3:20, fourteen chapters, 1920 × 1080 landscape recording.
- Teaser: 0:55, five chapters, also landscape. Reframe separately if producing a vertical Short.
- Begin with the question of how a spark becomes motion. Show the exploded assembly early. Inspect one piston, reassemble, then move through mechanics, timing, intake, combustion, exhaust, oil and cooling. Close the covers and invite the viewer to change the throttle.
- Suggested title: **How a Car Engine Works — Take It Apart in 3D**.
- Suggested description opening: **Take the engine apart, follow the air and fuel, and watch four strokes turn combustion into motion. Then try the interactive and change the controls yourself.** Add the actual public interactive URL before publishing the video; the current Sites deployment is owner-private.
- The model remains an illustrative reconstruction. Animated fluid paths, throttle behavior and valve events are educational, not measured pressure/temperature/power simulation. The refined piston contours are not measured Toyota CAD.

## Voice direction and workflow

Use warm, curious, conversational English. Make the opening question inviting; slow slightly for the four strokes. Leave room for the viewer to inspect a part. The main script contains 475 words in 200 seconds; individual passages are below 155 words per minute. Read each passage into its marked time window and leave the remainder as a visual pause.

`engine-full-narration.txt` and `engine-teaser-narration.txt` are the timed voice scripts. Their matching SRT files use editorial timing; align the cues to the final spoken performance in an editor if the delivery differs.

No professional voice-generation service is connected in this session. A voice track has not been generated. The synthetic tone used for recording verification is a test fixture, not narration and not an asset to publish.

The creator controls accept a finished MP3, WAV or M4A. Audio stays in the browser and is associated with the selected tour version. It plays only when the user starts the tour. **Record tour** mixes the loaded audio into the saved video. A duration mismatch is shown before recording; short audio leaves silence and long audio ends with the tour. **Device voice** remains an optional listening preview and is not included in the recording.

## Editing decisions

The 3–4 minute main-film recommendation is an editorial starting point, not an algorithmic requirement. Use YouTube's [audience-retention report](https://support.google.com/youtube/answer/9314415?hl=en) after release to inspect the introduction and the moments viewers skip or replay. YouTube currently classifies eligible square/vertical uploads up to three minutes as [Shorts](https://support.google.com/youtube/answer/15424877?hl=en); the built-in recorder exports landscape video.

Keep the website silent until a visitor requests narration. Avoid automatic speech and background music competing with the explanation. The teaser ends before the viewer changes the throttle, giving the live interactive a distinct next step.

## Validation for this revision

- Fifteen engine-mechanics/tour tests check cycle behavior, exact assembly restoration, continuous camera boundaries, finite camera poses and complete caption coverage.
- Browser review visited every system chapter, then repeated the adjusted piston, timing and cooling close-ups. The isolated piston now includes visible ring grooves, skirt cutouts and hollow pin bosses; it remains illustrative geometry.
- A local recording test produced a 1920 × 1080 WebM. Decoding its audio yielded 10.8 seconds of non-silent audio (peak about 0.047), proving the supplied track was embedded in the saved media. A synthetic test tone was used solely for this check.
- Mobile controls and file removal passed without horizontal overflow or page errors. The script and captions can be exported from the creator controls. A professional spoken track still needs to be generated with the user's chosen voice service.
