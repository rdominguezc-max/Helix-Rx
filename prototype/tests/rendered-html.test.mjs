import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Helix application with PWA metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Helix — Tu tratamiento, en orden<\/title>/i);
  assert.match(html, /rel="manifest"[^>]*manifest\.webmanifest/i);
  assert.match(html, /name="theme-color" content="#153f35"/i);
  assert.match(html, /mobile-web-app-capable/i);
  assert.match(html, /Instalar app/i);
  assert.match(html, /Buenos días, Roberto/i);
});

test("ships an installable manifest and offline service worker", async () => {
  const [manifestText, worker, installButton] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../app/pwa-install-button.tsx", import.meta.url), "utf8"),
  ]);

  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.name, "Helix — Tu tratamiento, en orden");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.theme_color, "#153f35");
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  assert.match(worker, /serviceWorker|addEventListener\("fetch"/);
  assert.match(worker, /caches\.open/);
  assert.match(installButton, /beforeinstallprompt/);
  assert.match(installButton, /navigator\.serviceWorker\.register/);
});
