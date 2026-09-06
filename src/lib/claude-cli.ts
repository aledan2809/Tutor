import { spawn } from "node:child_process";

/**
 * The Claude CLI as a text provider.
 *
 * Separate from AIRouter on purpose. AIRouter's own claude path asks for
 * `claude-sonnet-4-20250514`, a dated id that no longer exists, so it exits 1 —
 * and AIRouter is shared with NO-TOUCH consumers, so its registry is not ours to
 * edit from here. This calls the binary the way `content-quality-mesh.ts` already
 * does and has done reliably on this box: the `sonnet` ALIAS, which keeps working
 * when the dated id behind it is retired.
 *
 * Subscription auth, not the metered API: ANTHROPIC_API_KEY is deleted from the
 * child's environment so the CLI falls back to the account token. Without that
 * line a generation run would quietly bill the API key instead.
 */

export interface ClaudeCliResult {
  ok: boolean;
  text: string | null;
  error?: string;
}

export async function callClaudeCli(
  prompt: string,
  opts: { timeoutMs?: number; model?: string } = {}
): Promise<ClaudeCliResult> {
  const { timeoutMs = 180_000, model = "sonnet" } = opts;

  return new Promise((resolve) => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;

    let out = "";
    let err = "";
    let settled = false;
    const done = (v: ClaudeCliResult) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };

    try {
      // stdin ignorat, nu „pipe".
      //
      // CLI-ul chiar așteaptă la stdin — o spune singur: „no stdin data received in
      // 3s, proceeding without it". Cu un pipe deschis pe care nimeni nu-l scrie și
      // nimeni nu-l închide, așteptarea aia n-are motiv să se termine. Nu costă
      // nimic: promptul intră prin argv, deci stdin nu ne trebuie deloc.
      const child = spawn("claude", ["-p", prompt, "--output-format", "json", "--model", model], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      // A hung CLI must be killed, not waited on: it holds a request handler open,
      // and an unkilled child accumulates until the box runs out of them.
      const timer = setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {
          /* already gone */
        }
        // Ce apucase să scrie copilul, nu doar faptul că a expirat: fără asta, un
        // CLI blocat arată identic cu unul lent, iar în jurnal apare doar eroarea
        // furnizorului de rezervă. M-a costat trei diagnostice greșite.
        const seen = (err || out).trim().replace(/\s+/g, " ").slice(0, 200);
        done({
          ok: false,
          text: null,
          error:
            `timeout după ${Math.round(timeoutMs / 1000)}s` +
            (seen ? ` · copilul scrisese: „${seen}"` : " · copilul nu scrisese nimic"),
        });
      }, timeoutMs);

      child.stdout.on("data", (d) => (out += d.toString()));
      child.stderr.on("data", (d) => (err += d.toString()));
      child.on("error", (e) => {
        clearTimeout(timer);
        done({ ok: false, text: null, error: `nu s-a putut porni: ${e.message}` });
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        try {
          const j = JSON.parse(out) as { is_error?: boolean; result?: string };
          // exit 0 with is_error is a real failure the envelope reports; treating it
          // as success is how an error message ends up stored as content.
          if (j.is_error) {
            done({ ok: false, text: null, error: String(j.result ?? "is_error").slice(0, 300) });
            return;
          }
          done({ ok: true, text: j.result ?? null });
        } catch {
          done({
            ok: false,
            text: null,
            error: `exit ${code}: ${(err || out).slice(0, 300)}`,
          });
        }
      });
    } catch (e) {
      done({ ok: false, text: null, error: (e as Error).message });
    }
  });
}

/** Is the CLI usable at all right now? One cheap call, for a preflight. */
export async function claudeCliAvailable(): Promise<boolean> {
  const r = await callClaudeCli("Răspunde doar cu: PONG", { timeoutMs: 30_000 });
  return r.ok && /PONG/i.test(r.text ?? "");
}
