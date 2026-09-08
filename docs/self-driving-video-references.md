# Self-driving animation references and final pass

Research date: September 8, 2026. View counts are approximate snapshots, not projected views for How Things Click. Large channels and years of distribution make the totals unsuitable as a launch forecast.

## Reference shortlist

| Reference | Observed reach | Fit for this lab |
| --- | --- | --- |
| [Waymo 360° Experience: A Fully Autonomous Driving Journey](https://www.youtube.com/watch?v=B8R148hFxPw), February 2018 | YouTube page displayed 1.4M views; indexed count 1,403,991 | Best direct teaching reference found: connect an actual road scene with detected objects, predicted motion and a chosen route. |
| [CGP Grey: Traffic Has a Perfect Solution. Humans Are the Problem.](https://www.youtube.com/watch?v=iHzzSao6ypE), August 2016; previously titled The Simple Solution to Traffic | Indexed YouTube count 44,458,984 | Broader traffic/coordination animation. Useful evidence of audience interest in a familiar problem; not a benchmark for vehicle-internal engineering or Tesla performance. |
| [TED-Ed: How do self-driving cars “see”?](https://www.youtube.com/watch?v=PRg5RNU_JLk), May 2019 | Indexed YouTube count 601,031 | Focused sensor explanation, below one million. Its LiDAR subject must not be transferred into our camera-based Cybercab model. |
| [Thomas Schwenke: Autonomous car / self-driving car — How it works!](https://www.youtube.com/watch?v=gEy91PGGLR0), May 2018 | Indexed YouTube count 182,294 | Direct engineering topic and sensor overview; below one million despite a relevant animation format. |

Waymo was visually sampled in the browser around 1:02, 1:08 and 1:23, including the transition from the road to object/route overlays. This was a sampled review, not a complete frame-by-frame video analysis. The other candidates were screened through their published descriptions and indexed metadata.

Waymo’s [production account](https://waymo.com/blog/2018/02/recreating-self-driving-experience-the-360-video/) explains that its video used real trip data, visualized sensors and software predictions, and was produced with Google Creative Lab. Our deterministic browser model does not have that production data or validate autonomous-driving performance.

## Comparison and resulting implementation

Our advantage is interaction: inspect the cabin, disassemble the car, open the controller, change conditions, scrub time and follow wheel feedback. The strongest direct reference makes a road event and the software interpretation legible together. Previously our road, perception, planning and mechanism views required visitors to assemble that relationship themselves.

The new **Road test → Decision view** connects:
- the existing 3D street and Cybercab;
- a synchronized top-down visibility map with unknown areas;
- observed pedestrian and predicted movement, only after observation;
- route and stopping boundary;
- measured/requested speed, acceleration and actual model steering.

Checkpoints are derived from the simulated event times. Changing settings recomputes them. Hidden, detected, braking and clear moments can be paused and replayed; signal and roadworks scenarios have their own checkpoints.

The two road chapters use the same composition in the 1080p recorder. The master remains 4:30 and the 518-word narration and its timing are unchanged. The map and telemetry are technical annotations, not narration captions.

All new visuals and code are original to this project. No reference footage, models, narration or music was copied.

## Remaining publication work

- Supply and listen through the final narration recording using the timed script.
- Record the complete tour with that audio; review the final sound mix and export.
- Publish the feature branch/site update and upload the approved video when requested.

The local feature pass does not by itself publish a new production version.
