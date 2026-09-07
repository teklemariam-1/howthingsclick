# How Things Click

Interactive 3D explainers for curious minds. A browsable homepage leads into a four-stroke engine lab and an explorable Corolla.

## Run locally
Use Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

- `/`: homepage, search, and experience categories
- `/engine`: engine simulation, disassembly, systems, guided tour, and local video recording
- `/car`: whole-car exploration and an embedded engine lab

The models are illustrative educational reconstructions, not manufacturer CAD.

## Deploy on Vercel
Import [teklemariam-1/howthingsclick](https://github.com/teklemariam-1/howthingsclick) into Vercel. The repository root is the project root.

The committed `vercel.json` sets:
- Framework preset: Other
- Build command: `npm run build:vercel`
- Output directory: `dist/client`

If the Vercel project has existing dashboard overrides, match these settings. No environment variables or API keys are needed for the current features. The static build prerenders all three pages; WebGL, controls, audio, and recording run in the visitor's browser. Uploaded narration stays on the device.

To verify locally:
```sh
npm run build:vercel
```

Connect `howthingsclick.com` in Vercel's domain settings when ready. Vercel supplies the DNS records for the selected project. This repository configuration does not itself create a Vercel deployment or change DNS.

## Existing Sites preview
`npm run build` preserves the separate Cloudflare/Sites build. `.openai/hosting.json` identifies that existing preview. The static build intentionally omits the Sites and Cloudflare runtime plugins.

## Branding
Vector wordmarks and the standalone mark are in `public/brand/`. Dark-ink and light-ink versions are included, alongside square PNG icons. Use the light wordmark on dark backgrounds and leave at least the width of the detached square around the logo. The mark suggests parts coming together: an open C and a small component clicking into place.

Colors: ink `#20251F`, paper `#F8F9F4`, accent `#D5EF78`.
