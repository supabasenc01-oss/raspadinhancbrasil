// Minimal Nitro server entry used only during the static build.
//
// The `static` Nitro preset doesn't ship a default runtime entry (it has no
// "entry" field — see node_modules/nitro/dist/_presets.mjs, the `static`
// preset definition), but the Vite build pipeline (node_modules/nitro/dist/vite.mjs,
// `buildEnvironments`) unconditionally builds the "nitro" environment at the
// end of the build regardless of preset. Without an explicit entry, Vite
// falls back to its default `index.html` input, which then fails with
// "rolldownOptions.input should not be an html file when building for SSR."
//
// This file is that entry. Its output (.output/server/index.mjs) is not
// actually used at runtime on static hosting (Hostinger has no Node.js) —
// only .output/public is uploaded — but Nitro needs a valid JS entry to
// complete the build.
import "#nitro/virtual/polyfills";
import { useNitroApp } from "nitro/app";

const nitroApp = useNitroApp();

export default { fetch: nitroApp.fetch };
