# Self-driving video production

Length: **4:30**, thirteen shots. Record at **1920 × 1080**. The browser requests 30 fps; actual smoothness depends on the computer.

## Title

How Does a Self-Driving Car Work? Inside the Cybercab in 3D

## Description

No steering wheel. No pedals. What makes a self-driving car move?

Open a Cybercab-inspired 3D model and follow the loop from camera images to computing, planning, steering and braking. Then try the experiments yourself:
https://www.howthingsclick.com/self-driving

Change the speed, reveal hidden hardware, and watch decisions change. Subscribe to How Things Click for the next interactive explanation.

This is an educational model. Hardware placement and driving behavior are simplified; it does not reproduce Tesla’s proprietary software.

#SelfDrivingCars #Cybercab #HowThingsWork

## YouTube chapters

0:00 How does a car drive itself?
0:12 A cabin built for passengers
0:24 Peel back the body
0:42 Start with light
1:02 Inside the onboard computer
1:26 Build a picture of the world
1:48 Choose where—and when—to move
2:10 A small command controls motor power
2:40 Turn commands into forces
3:02 Supply power. Carry heat away.
3:24 The hidden pedestrian
3:46 Watch the wheels follow the path
4:08 Your turn to experiment

## Narration and edit

- Use self-driving-narration.txt for the timed readings. self-driving-voice-only.txt contains only spoken text.
- self-driving-cues.json gives exact absolute voice-in/out times for editing.
- Generate each chapter in the same voice and style, then place it at the specified time. Fill the gaps with silence and export a 4:30 master.
- Keep narration clear and forward. If adding music, start around 20–26 dB quieter than the voice, then check audibility on speakers and headphones. Avoid music under the opening question if it weakens the hook.
- Do not burn narration captions into this export. Upload a correctly timed caption file to YouTube separately only after the final voice is approved.
- The last 22 seconds invite viewers to change the experiment on the site. Add optional YouTube end-screen elements in the final 5–8 seconds without covering the car or site address.

## Browser recording

1. Open /self-driving and wait for the 3D model to finish loading.
2. Expand Recording studio. Add the finished 4:30 narration file.
3. Click Record tour. It always begins at 0:00 with the correct opening camera.
4. Keep the tab visible. Play/Pause pauses or resumes the tour, audio and recorder together.
5. Switching away pauses capture. Return and press Play to resume. Hidden-tab time is excluded from the saved video.
6. The full tour stops automatically at 4:30. Save recording downloads the file; a preview appears below.
7. Stop and save before 4:30 creates a preview clip, not the complete video.
8. Check the opening, computer close-up, road sections, closing shot and audio sync before uploading.

The saved video contains the channel logo, website address and technical scene labels, but no narration captions. The browser chooses MP4 or WebM based on support. Shotcut can convert either to H.264 MP4 for delivery. The recorder saves locally; it does not upload to YouTube.

The two road chapters show the street and the car’s interpretation together, including visibility, route and physical response. These technical annotations use the same simulation frame as the scene. The narration script and all voice windows remain unchanged.

## Engineering references

- Tesla AI: https://www.tesla.com/AI
- Tesla butterfly-door operation: https://www.tesla.com/robotaxi/riderguides/cybercab/en_us/GUID-EF6607DD-3EEA-4733-8134-CF8C8D8FE859.html
- Typical EPS motor power stage: https://www.ti.com/solution/electric-power-steering-eps
- Tesla EV thermal-system maintenance: https://www.tesla.com/support/vehicle-maintenance
- Pedestrian asset and motion credits: /models/pedestrian-credits.md
- Feedback control design: https://autowarefoundation.gitlab.io/autoware.auto/AutowareAuto/controller-design.html
- Tesla Cybercab rider guide: https://www.tesla.com/robotaxi/riderguides/cybercab/en_us/GUID-669E83C2-E7DE-40F4-9DBD-C9A32E7F6DFF.html
- Tesla Cybercab emergency response guide: https://digitalassets.tesla.com/tesla-contents/image/upload/2026-cybercab-emergency-response-guide.pdf
- Autoware architecture (an example of a modular autonomy stack, not Tesla’s implementation): https://docs.autoware.org/1.5.0/design/autoware-architecture-v2/roadmap/autonomous-driving-stack-architecture/

The narration explains functions that an autonomy system must perform. It does not assert that Tesla implements them as separate software modules. Camera counts, hidden network architecture, measured latency and autonomous-driving performance are deliberately not invented.
