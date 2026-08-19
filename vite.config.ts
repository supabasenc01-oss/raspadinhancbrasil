// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // Hostinger's shared hosting plan has no Node.js runtime — ship a static SPA
    // (client-side routing with a prerendered app-shell) instead of SSR.
    spa: { enabled: true },
  },
  // Static preset: build output is plain static files (.output/public), no server needed.
  // `entry` is a workaround: the `static` preset ships no default runtime entry, but
  // nitro's Vite build pipeline unconditionally builds a "nitro" environment at the end
  // of the build regardless of preset, and without an explicit entry it falls back to
  // vite's default `index.html` input, which crashes ("rolldownOptions.input should not
  // be an html file when building for SSR"). See src/nitro-static-entry.ts for details.
  // The resulting server bundle is unused at runtime on static hosting.
  nitro: {
    preset: "static",
    entry: "./src/nitro-static-entry.ts",
    // Disable Nitro's own default `prerender.crawlLinks` (the `static` preset otherwise
    // sets it true and crawls from "/"). TanStack Start's `spa.enabled` option already runs
    // its own prerender pass (see the `hooks.compiled` comment below) that renders the SPA
    // app-shell into the client output directory — that's what ends up as the site's
    // index.html. Nitro's own crawler runs earlier, against Nitro's own compiled server
    // bundle, which has no route registered for "/" (a client-only SPA route), so it always
    // 404s. We don't need Nitro to prerender anything itself.
    prerender: { crawlLinks: false, routes: [] },
    hooks: {
      // Fires once Nitro has finished its own build (after `.output/public` is populated
      // and Nitro's "nitro" environment is built), but *before* TanStack Start's own
      // SPA-shell prerender step runs (spa.enabled: true — see
      // node_modules/@tanstack/start-plugin-core/dist/esm/vite/prerender.js). That step
      // spawns a *separate* `vite preview` process to render "/" and needs to import the
      // compiled SSR bundle from "dist/server/server.js" (TanStack's hardcoded default —
      // see getServerOutputDirectory in .../vite/output-directory.js). Nitro's own plugin
      // builds that same SSR bundle to node_modules/.nitro/vite/services/ssr/index.js
      // instead, and its config hook that would normally redirect the output path is
      // disabled during `vite preview` (apply: (_config, configEnv) => !configEnv.isPreview
      // in node_modules/nitro/dist/vite.mjs), so the preview process can't find it
      // (ERR_MODULE_NOT_FOUND) and the shell prerender fails. Copying the already-built
      // service into dist/server/server.js here (mirroring nitro's internal service dir
      // structure so relative asset imports keep working) satisfies TanStack's lookup
      // without touching node_modules or nitro's own build.
      compiled(nitro) {
        const from = resolve(nitro.options.buildDir, "vite/services/ssr");
        const to = resolve(nitro.options.rootDir, "dist/server");
        if (existsSync(from)) {
          cpSync(from, to, { recursive: true });
          cpSync(resolve(to, "index.js"), resolve(to, "server.js"));
        }
      },
    },
  },
});
