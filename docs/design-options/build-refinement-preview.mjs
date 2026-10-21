// Isolated static mockups only. Does not edit src/, build output, or production.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const out = new URL("./refinement/", import.meta.url);
const { mkdirSync } = await import("node:fs");
mkdirSync(out, { recursive: true });
const css = readFileSync(new URL("../../src/app.css", import.meta.url), "utf8");
const refinedCss = `
/* Proposed refinement, limited to this static preview. */
.reference-table .species-reference,.reference-table .cp-reference{text-decoration:none}
.reference-table .species-reference{font-size:.9rem;font-weight:600;padding:.35rem .2rem;margin-left:-.2rem}
.reference-table .species-reference:hover,.reference-table .cp-reference:hover{background:var(--soft);color:var(--accent)}
.reference-table .species-reference:active,.reference-table .cp-reference:active{background:var(--line)}
.reference-table th,.reference-table td{padding:.35rem .8rem;border-bottom:1px solid var(--line)}
.reference-table td{text-align:right}
.reference-table tbody th{font-size:.9rem}
.reference-table tbody small{margin-top:.12rem;font-size:.68rem}
.reference-table thead tr:nth-child(2) th{text-align:right;padding-right:2.4rem;font-size:.72rem;font-weight:600}
.reference-table .cp-reference{display:inline-grid;grid-template-columns:5ch 1.1rem;gap:.3rem;align-items:center;min-height:2.25rem;padding:.2rem .2rem;font-size:1rem;line-height:1.4;border-radius:2px}
.cp-value{text-align:right;font-variant-numeric:tabular-nums}
.marker-slot{display:flex;align-items:center;justify-content:center;width:1.1rem;height:1.1rem;color:var(--accent)}
[data-preview=dotted] .reference-table .cp-reference{grid-template-columns:5ch;gap:0}
[data-preview=dotted] .cp-reference[data-ambiguous=true] .cp-value{text-decoration:underline dotted var(--accent);text-decoration-thickness:1px;text-underline-offset:5px}
[data-preview=label] .reference-table .cp-reference{grid-template-columns:5ch 5rem}
[data-preview=label] .ambiguity-label{width:5rem;justify-content:flex-start;font-size:.65rem;line-height:1.3;color:var(--muted);white-space:nowrap;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}

.reference-intro h2{font-size:1.8rem;margin-bottom:.8rem}
.reference-legend{margin:.6rem 0;font-size:.73rem}
#reference-dialog{position:fixed;width:min(28rem,calc(100% - 1.5rem));padding:1.15rem;border-radius:3px;max-height:90dvh}
#reference-dialog h2{font-size:1.25rem;line-height:1.25;letter-spacing:-.025em;margin:0 2.3rem .5rem 0}
#reference-dialog-close{position:absolute;right:.7rem;top:.7rem;display:grid;place-items:center;float:none;width:30px;height:30px;padding:0;border:1px solid var(--line);border-radius:2px;font-size:1.25rem;line-height:1}
#reference-dialog-close:hover{background:var(--soft)}
#reference-dialog-content>p:first-child{font-size:.78rem;line-height:1.4;color:var(--muted);margin:.4rem 0 .8rem}
#reference-dialog-content>.combination-count{font-size:.92rem;font-weight:600;line-height:1.4;margin:.6rem 0}
.reference-matches{border:0;padding:0;margin:.7rem 0}
.reference-ivs th,.reference-ivs td{padding:.45rem .35rem}
.reference-ivs th{font-size:.7rem;width:33.333%}
.reference-ivs th:last-child{width:33.333%}
.reference-ivs td,.reference-ivs td:last-child{font-size:1rem;color:var(--ink);font-weight:400}
.reference-ivs tr[data-perfect=true]{background:var(--soft)}
.reference-assumptions{border-bottom:1px solid var(--line);margin:.2rem 0 .8rem;padding:.2rem 0 .65rem;font-size:.75rem;color:var(--muted)}
.reference-assumptions summary{cursor:pointer;min-height:1.6rem;display:list-item;font-weight:500}
.reference-assumptions p{font-size:.75rem;line-height:1.5;margin:.5rem 0}
#use-reference-cp{width:100%;min-height:38px;padding:.4rem .65rem;font-size:.8rem;margin-top:.25rem}
@media(max-width:640px){.reference-table th,.reference-table td{padding:.35rem .25rem}.reference-table .cp-reference{grid-template-columns:4.5ch 1rem;gap:.15rem}.reference-table thead tr:nth-child(2) th{padding-right:1.4rem}.reference-table .species-reference{font-size:.8rem}[data-preview=dotted] .reference-table .cp-reference{grid-template-columns:4.5ch}[data-preview=label] .reference-table th:first-child{width:34%}[data-preview=label] .reference-table .cp-reference{grid-template-columns:1fr;grid-template-rows:1.2rem .9rem;min-width:4.5rem;width:100%;font-size:.95rem;padding:.2rem 0}[data-preview=label] .ambiguity-label{width:auto;justify-content:flex-end;font-size:.7rem;height:.9rem}.reference-ivs th,.reference-ivs td{padding:.48rem .3rem}}
`;
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext();
const page = await context.newPage();
const rows = [
  "BULBASAUR",
  "CHARMANDER",
  "CATERPIE",
  "WEEDLE",
  "RATTATA",
  "MAGIKARP",
  "SHUCKLE",
  "MEWTWO",
];
for (const lang of ["en", "ja"])
  for (const mode of ["reference", "modal"]) {
    await page.setViewportSize(
      mode === "reference"
        ? { width: 1440, height: 1000 }
        : { width: 390, height: 844 },
    );
    const theme = mode === "modal" ? "dark" : "light";
    await page.goto(
      `http://127.0.0.1:4173/raid-iv-odds/?species=WEEDLE&view=reference&q=Weedle&lang=${lang}`,
    );
    await page.evaluate(
      (theme) => (document.documentElement.dataset.theme = theme),
      theme,
    );
    if (mode === "reference") {
      const snapshots = [];
      for (const id of rows) {
        await page.locator("#reference-search").fill(id);
        snapshots.push(
          await page
            .locator("#reference-rows tr")
            .first()
            .evaluate((e) => e.outerHTML),
        );
      }
      await page.evaluate(
        ({ snapshots, lang }) => {
          document.querySelector("#reference-rows").innerHTML =
            snapshots.join("");
          document.querySelector("#reference-search").value = "";
          document.querySelector("#reference-count").textContent =
            lang === "en"
              ? "8 representative species/forms · design comparison"
              : "比較用の8種族・すがた";
          document.querySelector("#load-more").hidden = true;
        },
        { snapshots, lang },
      );
    } else {
      await page
        .locator(
          "[data-cp-species=WEEDLE][data-cp-group=rocket][data-cp-boosted=false]",
        )
        .click();
    }
    for (const variant of ["before", "dotted", "label"]) {
      const html = await page.evaluate(
        ({ variant, lang, theme }) => {
          const clone = document.documentElement.cloneNode(true);
          clone.dataset.theme = theme;
          clone.querySelectorAll("script,link").forEach((e) => e.remove());
          clone
            .querySelectorAll("input")
            .forEach((e) =>
              e.setAttribute(
                "value",
                document.getElementById(e.id)?.value ?? "",
              ),
            );
          clone.querySelector("title").textContent =
            `Option A ${variant} · isolated design preview`;
          if (variant !== "before") {
            clone.dataset.preview = variant;
            clone.querySelector(".reference-legend").textContent =
              lang === "en"
                ? variant === "dotted"
                  ? "Dotted CP: multiple IV combinations. Tap for details."
                  : "Multiple IVs: this CP has more than one IV combination. Tap for details."
                : variant === "dotted"
                  ? "点線のCP：複数の個体値が一致。選ぶと詳細を表示。"
                  : "複数個体値：同じCPに複数の組み合わせ。選ぶと詳細を表示。";
            clone.querySelectorAll(".cp-reference").forEach((b) => {
              const number = Array.from(b.childNodes)
                .filter((n) => n.nodeType === 3)
                .map((n) => n.textContent)
                .join("")
                .trim();
              const ambiguous = !!b.querySelector(".collision-icon");
              b.dataset.ambiguous = String(ambiguous);
              const hint =
                b.querySelector(".collision-explanation")?.outerHTML ?? "";
              b.innerHTML = `<span class="cp-value">${number}</span>${variant === "label" ? `<span class="marker-slot ambiguity-label" aria-hidden="true">${ambiguous ? (lang === "en" ? "Multiple IVs" : "複数個体値") : ""}</span>` : ""}${hint}`;
            });
            const content = clone.querySelector("#reference-dialog-content");
            if (content.children.length) {
              content.children[1].textContent =
                lang === "en"
                  ? "4 matching IV combinations"
                  : "一致する個体値は4通り";
              content.children[1].className = "combination-count";
              const assumptions = content.children[2];
              const details = document.createElement("details");
              details.className = "reference-assumptions";
              const summary = document.createElement("summary");
              summary.textContent =
                lang === "en" ? "Calculation assumptions" : "計算条件";
              details.append(summary, assumptions);
              content.insertBefore(
                details,
                content.querySelector("#use-reference-cp"),
              );
              clone
                .querySelectorAll(".reference-ivs tr")
                .forEach((row) => row.lastElementChild.remove());
              clone.querySelector(".reference-ivs caption").className =
                "sr-only";
            }
          }
          return "<!doctype html>" + clone.outerHTML;
        },
        { variant, lang, theme },
      );
      const script = `<script>const d=document.querySelector('dialog');if(d?.open){d.close();d.showModal();}document.querySelector('#reference-dialog-close').onclick=()=>d.close();document.querySelectorAll('[data-ref-mode]').forEach(b=>b.onclick=()=>{document.querySelector('.reference-table').dataset.mode=b.dataset.refMode;document.querySelectorAll('[data-ref-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});document.querySelectorAll('.cp-reference[data-ambiguous=true]').forEach(b=>b.onclick=()=>{document.querySelector('#reference-dialog-title').textContent=b.closest('tr').querySelector('.species-reference').textContent+' · CP '+b.querySelector('.cp-value').textContent;document.querySelector('#reference-dialog-content').textContent=b.querySelector('.collision-explanation').textContent;d.showModal();});</script>`;
      const hash = createHash("sha256")
        .update(script.slice(8, -9))
        .digest("base64");
      const policy =
        "default-src 'none'; base-uri 'none'; object-src 'none'; form-action 'none'; script-src 'sha256-" +
        hash +
        "'; img-src data:; style-src 'unsafe-inline'";
      const safeHtml = html.replace(
        /(<meta http-equiv="Content-Security-Policy" content=")[^"]+/,
        "$1" + policy,
      );
      const filename = `${variant}-${mode}-${lang}-${theme}.html`;
      writeFileSync(
        new URL(filename, out),
        safeHtml
          .replace(
            "</head>",
            `<style>${css}\n${variant !== "before" ? refinedCss : ""}</style></head>`,
          )
          .replace("</body>", script + "</body>"),
      );
    }
  }
await browser.close();
