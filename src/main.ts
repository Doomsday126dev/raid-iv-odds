import catalog from "./catalog.json";
import { cpFor, formatPercent, type CpSummary } from "./math";
import { ROCKET_LEVELS, analyzeEncounter, type Encounter } from "./encounters";
import "./app.css";

type Species = (typeof catalog.pokemon)[number];
const all = catalog.pokemon;
const params = new URLSearchParams(location.search);
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const unknownSpecies =
  params.has("species") && !all.some((p) => p.id === params.get("species"));
const oldName = params.get("pokemon")?.toLowerCase();
let selected: Species =
  all.find(
    (p) => p.id === params.get("species") || p.name.toLowerCase() === oldName,
  ) ?? all.find((p) => p.id === "MEWTWO")!;
let encounter: Encounter =
  params.get("encounter") === "rocket" ? "rocket" : "raid";
let clarified: boolean | null = null;
let cpText = params.get("cp") ?? "";
let view = params.get("view") === "reference" ? "reference" : "check";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<header class="site-header"><a class="brand" href="./" aria-label="Hundo Check home"><span class="brand-mark" aria-hidden="true">IV</span> Hundo<span>Check</span></a><span class="header-note">Catch CP / IV reference</span><button class="theme-button" aria-label="Toggle dark mode">◐</button></header>
<main>
<div class="intro"><p class="eyebrow">POKÉMON GO / CP FIELD GUIDE</p><h1>Purified hundo check</h1><p>Check catch CP for a possible <strong>purified 15 / 15 / 15.</strong></p></div>
<nav class="view-tabs" aria-label="Tools"><button data-view="check">✦ &nbsp; Purification check</button><button data-view="reference">☷ &nbsp; Pokémon CP reference</button></nav>
<section id="check-view">
<div class="workspace">
<section class="input-card" aria-labelledby="setup-heading"><div class="section-heading"><h2 id="setup-heading">Your encounter</h2></div>
<label for="species-search">Pokémon </label>
<div class="species-picker"><input id="species-search" type="search" autocomplete="off" placeholder="Search Pokémon…" role="combobox" aria-expanded="false" aria-controls="species-list" aria-autocomplete="list"/><div id="species-list" role="listbox" aria-label="Pokémon search results" hidden></div></div>
<p id="species-meta" class="field-note"></p><div class="quick-picks" aria-label="Quick picks">${["MEWTWO", "RATTATA", "MAGIKARP", "BULBASAUR"].map((id) => `<button data-species="${id}">${all.find((p) => p.id === id)!.name}</button>`).join("")}</div>
<fieldset><legend>Where did you find it?</legend><div class="segmented"><button data-encounter="raid">Shadow raid <small>Raid catch</small></button><button data-encounter="rocket">Team GO Rocket <small>Grunt or Leader</small></button></div></fieldset>
<label for="cp-input">Catch CP </label><div class="cp-entry"><span>CP</span><input id="cp-input" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Enter CP" aria-describedby="cp-context"/></div><p id="cp-context" class="field-note"></p>
</section>
<section class="decision-column"><div class="section-heading"><h2>Result</h2></div><div id="decision" role="status" aria-live="polite" aria-atomic="true" tabindex="-1"></div><p class="appraisal-tip"><span aria-hidden="true">↗</span> Appraisal confirms the IVs. Each must be <strong>at least 13</strong> before purification.</p></section>
</div>
<details class="disclosure watch"><summary><span><strong>Purifiable CP candidates</strong><small>A shortlist for this Pokémon and encounter</small></span><span aria-hidden="true">+</span></summary><div id="watchlist"></div></details>
</section>
<section id="reference-view" hidden aria-labelledby="reference-heading"><div class="reference-intro"><p class="eyebrow">ORDINARY POKÉMON, TOO</p><h2 id="reference-heading">Find a perfect CP.</h2><p>Search <strong>15/15/15 CPs</strong> for both weather conditions.</p></div><div class="context-note"><strong>Rocket catch reference.</strong> Wild levels vary. Matching CP alone does not prove perfect IVs.</div><label for="reference-search" class="sr-only">Search CP reference</label><input id="reference-search" type="search" placeholder="Search species, form or Pokédex number…" autocomplete="off"/><p id="reference-count" class="field-note" aria-live="polite"></p><div class="reference-table"><table><thead><tr><th scope="col">Pokémon</th><th scope="col">Non-weather boosted</th><th scope="col">Weather boosted</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody id="reference-rows"></tbody></table></div><button id="load-more" class="secondary">Show more Pokémon</button><p class="field-note">Reference scope: released species/forms with positive base stats; Mega, Primal and duplicate Shadow variants are excluded. A listing does not mean it currently spawns in the wild, raids, or Rocket encounters.</p></section>
<details class="disclosure"><summary><span><strong>How the check works</strong><small>Mechanics, assumptions & data</small></span><span aria-hidden="true">+</span></summary><div class="notes"><h3>CP narrows the possibilities. Appraisal confirms them.</h3><p>Purification adds 2 to each IV, capped at 15. A Shadow Pokémon needs at least 13 Attack, 13 Defense and 13 HP to become a hundo. Shadow battle damage bonuses do not change catch CP.</p><p>We enumerate every IV triple at the selected level and IV floor, then count only the triples producing your exact integer CP. Shadow raids use a 6/6/6 floor; Rocket encounters use 0/0/0, or 4/4/4 with weather boost. Special events may differ.</p><p>Displayed odds assume all permitted IV triples are equally likely. A 100% result applies only to the selected species/form, encounter level and floor. Confirm those settings and appraise before purifying. A hundo is not always the best battle choice.</p><h3>Catalog scope</h3><p>${all.length.toLocaleString()} released species/forms from <a href="https://github.com/pvpoke/pvpoke/tree/${catalog.revision}">PvPoke’s Pokémon GO species data</a>, snapshot imported ${catalog.generated}. Cosmetic/event variants and duplicate Normal forms are omitted. Release and historical Shadow eligibility follow the source snapshot, not the current encounter rotation.</p><p>Rocket presets cover Grunts and Leaders, not Giovanni or research. Only use the purification check for a Shadow Pokémon you can actually encounter. If your Pokémon or form is unavailable, use the CP reference or the <a href="./advanced.html">advanced calculator</a>.</p><p><a href="./advanced.html">Advanced calculator →</a> Custom IV floors, manual base stats, Japanese names and detailed raid comparisons.</p></div></details>
<footer><span>Calculated on your device.</span><div><a href="./privacy.html">Privacy</a><a href="https://github.com/Doomsday126dev/raid-iv-odds/issues/new">Feedback</a></div><p>Unofficial fan tool. Pokémon and game data belong to their respective owners. Not affiliated with Niantic, Scopely, Nintendo or The Pokémon Company.</p></footer>
</main><button id="mobile-result" hidden><span></span><strong>View result ↓</strong></button>`;
const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
const search = $<HTMLInputElement>("#species-search");
const input = $<HTMLInputElement>("#cp-input");
const list = $("#species-list");
let activeIndex = -1;
let matches: Species[] = [];
const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function matchSpecies(query: string) {
  const q = normalized(query);
  return all.filter(
    (p) =>
      normalized(p.name).includes(q) ||
      String(p.dex) === query ||
      normalized(p.id).includes(q),
  );
}
function showSuggestions() {
  matches = matchSpecies(search.value).slice(0, 30);
  activeIndex = -1;
  list.innerHTML = matches.length
    ? matches
        .map(
          (p, i) =>
            `<button role="option" aria-selected="false" id="option-${i}" data-choice="${p.id}"><strong>${escape(p.name)}</strong><small>#${String(p.dex).padStart(3, "0")} · ${p.types.join(" / ")}</small></button>`,
        )
        .join("")
    : "<p>No matching Pokémon. Try another name or number.</p>";
  list.hidden = false;
  search.setAttribute("aria-expanded", "true");
  search.removeAttribute("aria-activedescendant");
}
function closeSuggestions() {
  list.hidden = true;
  search.setAttribute("aria-expanded", "false");
  search.removeAttribute("aria-activedescendant");
}
function choose(id: string) {
  const p = all.find((p) => p.id === id);
  if (!p) return;
  selected = p;
  clarified = null;
  search.value = p.name;
  cpText = "";
  input.value = "";
  closeSuggestions();
  render();
}
search.addEventListener("input", () => {
  showSuggestions();
  render();
});
search.addEventListener("focus", () => {
  search.select();
  showSuggestions();
});
search.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSuggestions();
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (list.hidden) showSuggestions();
    activeIndex = Math.max(
      0,
      Math.min(
        matches.length - 1,
        activeIndex + (event.key === "ArrowDown" ? 1 : -1),
      ),
    );
    list
      .querySelectorAll("[role=option]")
      .forEach((node, i) =>
        node.setAttribute("aria-selected", String(i === activeIndex)),
      );
    if (matches.length) {
      search.setAttribute("aria-activedescendant", `option-${activeIndex}`);
      $(`#option-${activeIndex}`).scrollIntoView({ block: "nearest" });
    }
  }
  if (event.key === "Enter" && !list.hidden) {
    event.preventDefault();
    const p = matches[activeIndex < 0 ? 0 : activeIndex];
    if (p) choose(p.id);
  }
});
list.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-choice]");
  if (b) choose(b.dataset.choice!);
});
document.addEventListener("click", (e) => {
  if (!(e.target as HTMLElement).closest(".species-picker")) closeSuggestions();
});
document.addEventListener("focusin", (e) => {
  if (!(e.target as HTMLElement).closest(".species-picker")) closeSuggestions();
});
input.value = cpText;
search.value = unknownSpecies ? "" : selected.name;
input.addEventListener("input", () => {
  cpText = input.value.trim();
  clarified = null;
  render();
});
document
  .querySelectorAll<HTMLButtonElement>("[data-species]")
  .forEach((b) =>
    b.addEventListener("click", () => choose(b.dataset.species!)),
  );
document.querySelectorAll<HTMLButtonElement>("[data-encounter]").forEach((b) =>
  b.addEventListener("click", () => {
    encounter = b.dataset.encounter as Encounter;
    clarified = null;
    cpText = "";
    input.value = "";
    render();
  }),
);
function updateUrl() {
  const q = new URLSearchParams({
    species: selected.id,
    encounter,
  });
  if (cpText) q.set("cp", cpText);
  if (view === "reference") q.set("view", view);
  history.replaceState(null, "", `?${q}`);
}
function render() {
  const number = /^\d+$/.test(cpText) ? Number(cpText) : 0;
  const analysis = analyzeEncounter(selected, encounter, number);
  const matches =
    clarified === null
      ? analysis.matches
      : analysis.matches.filter((c) => c.boosted === clarified);
  const outcome =
    clarified === null
      ? analysis.outcome
      : !matches.length
        ? "invalid"
        : matches[0]!.summary.good === 0
          ? "none"
          : matches[0]!.summary.good === matches[0]!.summary.total
            ? "all"
            : "candidate";

  const contextText = (c: (typeof analysis.contexts)[number]) =>
    `${c.boosted ? "Weather boosted" : "Non-weather boosted"} · Level ${c.summary.raidLevel.level} · IV floor ${c.floor}/${c.floor}/${c.floor}`;
  document
    .querySelectorAll<HTMLButtonElement>("[data-encounter]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.encounter === encounter)),
    );
  $("#species-meta").textContent =
    search.value === selected.name
      ? `#${String(selected.dex).padStart(3, "0")} · ${selected.types.join(" / ")}`
      : "Select a Pokémon from the search results.";
  $("#cp-context").textContent =
    cpText && matches.length === 1
      ? `${encounter === "raid" ? "Shadow raid" : "Rocket encounter"} · ${matches[0]!.boosted ? "Weather boosted" : "Non-weather boosted"}`
      : "Weather boost detected from catch CP";
  let tone = "empty",
    icon = "✦",
    title = "Choose a Pokémon from the list",
    copy = "Select a matching species or form to check its CP.";
  if (search.value !== selected.name) {
  } else if (!selected.shadow) {
    title = "Use the CP reference for this form";
    copy =
      "No historical Shadow eligibility in this snapshot. Check availability before using a purification calculation.";
  } else if (cpText) {
    if (!/^\d+$/.test(cpText) || !Number.isSafeInteger(number) || number < 10) {
      tone = "invalid";
      icon = "?";
      title = "Enter a valid catch CP";
      copy = "Use a whole number of 10 or more from the catch screen.";
    } else if (outcome === "invalid") {
      tone = "invalid";
      icon = "?";
      title = "Check your encounter settings";
      copy = `CP ${escape(cpText)} matches neither catch level for this encounter. Check the species and form; powered-up Pokémon need a different level.`;
    } else if (outcome === "none") {
      tone = "none";
      icon = "−";
      title = "Cannot purify to a hundo";
      copy = "No compatible IV spread reaches 15/15/15 after purification.";
    } else if (outcome === "all") {
      tone = "good";
      icon = "✓";
      title = "Every match can purify to a hundo";
      copy =
        "All compatible IV spreads meet 13/13/13 under these encounter settings.";
    } else if (outcome === "ambiguous") {
      tone = "mixed";
      icon = "?";
      title = "Confirm the weather boost";
      copy =
        "This CP fits both catch levels, with different purification outcomes. Check the weather icon to narrow it down.";
    } else {
      tone = "mixed";
      icon = "✦";
      title = "Possible purified hundo";
      copy =
        "At least one compatible IV spread reaches 15/15/15 after purification. Other IV spreads share this CP.";
    }
  }
  const valid =
    search.value === selected.name &&
    !!cpText &&
    matches.length > 0 &&
    selected.shadow &&
    /^\d+$/.test(cpText) &&
    Number.isSafeInteger(number) &&
    number >= 10;
  const waiting = !cpText && search.value === selected.name && selected.shadow;
  input.setAttribute("aria-invalid", String(!!cpText && tone === "invalid"));
  $(".decision-column > .section-heading").hidden = waiting;
  $(".appraisal-tip").hidden = !valid;
  $("#decision").className = `decision ${tone}`;
  $("#decision").innerHTML = waiting
    ? '<p class="empty-message">Enter CP to check for a possible purified hundo.</p>'
    : `<div class="decision-top"><span class="decision-icon" aria-hidden="true">${icon}</span><span class="eyebrow">PURIFIED HUNDO CHECK</span></div><h2>${title}</h2><p>${copy}</p>${valid ? `<div class="result-context"><strong>${escape(selected.name)} · CP ${escape(cpText)}</strong><span>${matches.length === 1 ? `${encounter === "raid" ? "Shadow raid" : "Rocket encounter"} · ${matches[0]!.boosted ? "Weather boosted" : "Non-weather boosted"}` : "Both weather conditions match this CP"}</span></div>${outcome === "ambiguous" ? `<div class="ambiguity-options">${matches.map((c) => `<button data-clarify="${c.boosted}"><strong>${c.boosted ? "Weather boosted" : "Non-weather boosted"}</strong><small>${c.summary.good ? "Could purify to hundo" : "Cannot purify to hundo"}</small></button>`).join("")}</div>` : ""}<details class="result-details"><summary>Why this result? <span>${matches.length === 1 ? `${matches[0]!.summary.good} of ${matches[0]!.summary.total} spreads` : "By catch level"}</span></summary>${matches.map((c) => `<h3>${contextText(c)}</h3><p><strong>${formatPercent(c.summary.odds)}</strong> (${c.summary.good}/${c.summary.total}) of matching IV spreads purify to 15/15/15, assuming equal likelihood at this level. CP alone does not identify the original IVs.</p>${spreads(c.summary)}`).join("")}${matches.length > 1 ? "<p>No combined probability is shown: the relative likelihood of the two catch levels is unknown.</p>" : ""}</details>` : ""}`;
  $("#decision")
    .querySelectorAll<HTMLButtonElement>("[data-clarify]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        clarified = b.dataset.clarify === "true";
        render();
      }),
    );
  $("#watchlist").innerHTML =
    search.value !== selected.name
      ? '<p class="field-note">Choose a Pokémon first.</p>'
      : analysis.contexts
          .map(
            (c) =>
              `<h3>${contextText(c)}</h3><div class="cp-chips">${selected.shadow ? c.summary.watchlist.map((row) => `<button data-cp="${row.cp}"><strong>${row.cp}</strong><span>${row.good === row.total ? "All matches" : `${row.good}/${row.total} matches`}</span></button>`).join("") : "No historical Shadow eligibility for this form."}</div>`,
          )
          .join("");
  $("#watchlist")
    .querySelectorAll<HTMLButtonElement>("[data-cp]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        cpText = b.dataset.cp!;
        input.value = cpText;
        clarified = null;
        render();
        $("#decision").focus();
        $("#decision").scrollIntoView({ behavior: "smooth", block: "nearest" });
      }),
    );
  $("#mobile-result").hidden =
    !cpText || view !== "check" || search.value !== selected.name;
  $("#mobile-result span").textContent = title;
  if (search.value === selected.name) updateUrl();
}
function spreads(s: CpSummary) {
  return `<div class="spread-list"><div class="spread-header"><span>Attack / Defense / HP</span><span>After purification</span></div>${s.combos.map((c) => `<div><code>${c.a} / ${c.d} / ${c.s}</code><span class="${c.good ? "qualifies" : ""}">${c.good ? "✓ 15 / 15 / 15" : `${c.purified.a} / ${c.purified.d} / ${c.purified.s}`}</span></div>`).join("")}</div>`;
}
let referenceLimit = 40;
function renderReference() {
  const results = matchSpecies(
    $<HTMLInputElement>("#reference-search").value.trim(),
  );
  $("#reference-count").textContent =
    `Showing ${Math.min(referenceLimit, results.length)} of ${results.length.toLocaleString()} species/forms`;
  $("#reference-rows").innerHTML =
    results
      .slice(0, referenceLimit)
      .map(
        (p) =>
          `<tr><th scope="row"><strong>${escape(p.name)}</strong><small>#${String(p.dex).padStart(3, "0")} · ${p.types.join(" / ")}</small></th><td>${cpFor(p, 15, 15, 15, ROCKET_LEVELS[0]!.cpm)}</td><td>${cpFor(p, 15, 15, 15, ROCKET_LEVELS[1]!.cpm)}</td><td><button data-reference="${p.id}" aria-label="Check ${escape(p.name)} Rocket encounter">Check <span aria-hidden="true">↗</span></button></td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="4">No matching Pokémon. Try another name or number.</td></tr>';
  $("#load-more").hidden = referenceLimit >= results.length;
  $("#reference-rows")
    .querySelectorAll<HTMLButtonElement>("[data-reference]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        encounter = "rocket";
        choose(b.dataset.reference!);
        setView("check");
        search.focus();
        closeSuggestions();
      }),
    );
}
$<HTMLInputElement>("#reference-search").addEventListener("input", () => {
  referenceLimit = 40;
  renderReference();
});
$("#load-more").addEventListener("click", () => {
  referenceLimit += 40;
  renderReference();
});
$("#mobile-result").addEventListener("click", () => {
  $("#decision").scrollIntoView({ behavior: "smooth", block: "center" });
  $("#decision").focus({ preventScroll: true });
});
function setView(next: string) {
  view = next;
  $("#mobile-result").hidden = !cpText || view !== "check";
  $("#check-view").hidden = view !== "check";
  $("#reference-view").hidden = view !== "reference";
  document
    .querySelectorAll<HTMLButtonElement>("[data-view]")
    .forEach((b) =>
      b.setAttribute(
        "aria-current",
        b.dataset.view === view ? "page" : "false",
      ),
    );
  if (search.value === selected.name) updateUrl();
}
document
  .querySelectorAll<HTMLButtonElement>("[data-view]")
  .forEach((b) => b.addEventListener("click", () => setView(b.dataset.view!)));
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("hundo-check-theme") ?? "system";
} catch {
  /* Private browsing may disable storage. */
}
$(".theme-button").addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  const dark =
    current === "dark" ||
    (current === "system" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "light" : "dark";
  try {
    localStorage.setItem("hundo-check-theme", dark ? "light" : "dark");
  } catch {
    /* Optional preference. */
  }
});
render();
renderReference();
setView(view);
if (
  "serviceWorker" in navigator &&
  !["127.0.0.1", "localhost"].includes(location.hostname)
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  });
}
