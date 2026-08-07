import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("exposes a neutral password recovery flow and admin inbox", async () => {
  const [page, api] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/password-recovery-api.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /¿Olvidaste tu contraseña\?/);
  assert.match(page, /requestPasswordRecovery\(email\)/);
  assert.match(page, /administrador dará seguimiento personalmente/);
  assert.match(page, /Helix no solicita ni envía contraseñas/);
  assert.match(page, /Solicitudes de recuperación/);
  assert.match(page, /Marcar resuelta/);
  assert.match(api, /password-recovery-requests/);
  assert.doesNotMatch(api, /password\s*:/i);
});
