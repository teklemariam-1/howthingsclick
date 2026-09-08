# Pedestrian asset credits

Source: [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox).
Copyright (c) 2020 Microsoft. Distributed under the [MIT license](/licenses/microsoft-rocketbox-MIT.txt).

This site's pedestrian.glb is adapted from Male_Adult_01, m_walk_neutral.max.fbx and m_idle_breathe_01.max.fbx. The character, original textures and motion data are licensed assets; they are not original How Things Click artwork. Adaptations include pose retargeting, removal of planar root motion, adult-height normalization, material conversion, replacement of the original hair cards with a short cropped scalp, and texture compression.

Rebuild with Blender: scripts/blender/create-pedestrian.py. Download these files from the source repository into work/rocketbox:

- Assets/Avatars/Adults/Male_Adult_01/Export/Male_Adult_01.fbx
- Assets/Avatars/Adults/Male_Adult_01/Textures/m002_body_color.tga
- Assets/Avatars/Adults/Male_Adult_01/Textures/m002_head_color.tga
- Assets/Avatars/Adults/Male_Adult_01/Textures/m002_opacity_color.tga
- Assets/Avatars/Adults/Male_Adult_01/Textures/m002_body_normal.tga
- Assets/Avatars/Adults/Male_Adult_01/Textures/m002_head_normal.tga
- Assets/Animations/all_animations_max_motextr_xy/m_walk_neutral.max.fbx
- Assets/Animations/all_animations_max_motextr_static/m_idle_breathe_01.max.fbx

No remote API is used at runtime. Geometry, textures and both animation clips are embedded in the local GLB.
