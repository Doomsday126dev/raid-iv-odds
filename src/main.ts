import { allMatchesAlreadyPerfect } from "./presentation";
import { recordTraffic } from "./traffic";
import {cosmeticSearchAliases} from "./catalog-aliases";
import cosmeticAliases from "./cosmetic-aliases.json";
import catalog from "./catalog.json";
import { RAID_LEVELS, formatPercent as rawFormatPercent, type CpSummary } from "./math";
import {
  ROCKET_LEVELS,
  analyzeShadowCatch,
  type ShadowContextId,
} from "./encounters";
import { perfectReference } from "./reference";
import "./app.css";
import { shell } from "./ui";
import {
  t,
  language,
  nameOf,
  typesOf,
  normalizeSearch,
  japaneseName,
  germanName,
} from "./i18n";

const formatPercent = (value:number) => language === "de" ? rawFormatPercent(value).replace(".", ",") : rawFormatPercent(value);
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
const cosmeticAlias = (cosmeticAliases as Record<string,{target:string;english:string}>)[params.get("species") ?? ""];
if (cosmeticAlias) params.set("species", cosmeticAlias.target);
const unknownSpecies =
  params.has("species") && !all.some((p) => p.id === params.get("species"));
const oldName = params.get("pokemon")?.toLowerCase();
let selected: Species =
  all.find(
    (p) => p.id === params.get("species") || p.name.toLowerCase() === oldName,
  ) ?? all.find((p) => p.id === "MEWTWO")!;
const contextIds: ShadowContextId[] = [
  "rocket-normal",
  "rocket-boosted",
  "raid-normal",
  "raid-boosted",
];
const linkedContext =
  params.get("confirmedContext") ??
  (params.has("confirmedWeather") &&
  ["raid", "rocket"].includes(params.get("encounter") ?? "")
    ? `${params.get("encounter")}-${params.get("confirmedWeather")}`
    : null);
let clarified: ShadowContextId | null = contextIds.includes(
  linkedContext as ShadowContextId,
)
  ? (linkedContext as ShadowContextId)
  : null;
function normalizeCpText(value: string): string {
  // Accept decimal digits commonly pasted/entered with Japanese input methods.
  // Keep other syntax intact so the strict integer validation still rejects it.
  return value
    .replace(/[０-９]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 0xfee0),
    )
    .trim();
}
let cpText = normalizeCpText(params.get("cp") ?? "");
let view = params.get("view") === "reference" ? "reference" : "check";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = shell();
document.title = `${t("title")} · HundoCheck`;
const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
const search = $<HTMLInputElement>("#species-search");
const input = $<HTMLInputElement>("#cp-input");
const list = $("#species-list");
let activeIndex = -1;
let matches: Species[] = [];
function matchSpecies(query: string) {
  const q = normalizeSearch(query);
  return all.filter(
    (p) =>
      [p.name, p.id, japaneseName(p.id), germanName(p.id), ...cosmeticSearchAliases(p.id)].some((name) =>
        normalizeSearch(name).includes(q),
      ) || String(p.dex) === query,
  );
}
function showSuggestions() {
  matches = matchSpecies(search.value).slice(0, 30);
  activeIndex = -1;
  list.innerHTML = matches.length
    ? matches
        .map(
          (p, i) =>
            `<button role="option" tabindex="-1" aria-selected="false" id="option-${i}" data-choice="${p.id}"><strong>${escape(nameOf(p))}</strong><small>#${String(p.dex).padStart(3, "0")} · ${typesOf(p)}</small></button>`,
        )
        .join("")
    : `<p>${t("noResults")}</p>`;
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
  search.value = nameOf(p);
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
  // Enter may confirm IME text rather than select a species. Safari can report
  // the composition keyCode after isComposing has already become false.
  if (event.isComposing || event.keyCode === 229) return;
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
search.value = unknownSpecies ? "" : nameOf(selected);
input.addEventListener("input", () => {
  cpText = normalizeCpText(input.value);
  clarified = null;
  render();
});
document
  .querySelectorAll<HTMLButtonElement>("[data-species]")
  .forEach((b) =>
    b.addEventListener("click", () => choose(b.dataset.species!)),
  );
function updateUrl() {
  // Language/reference changes must not turn an unknown or unfinished species
  // into the internal default used only to keep the empty UI initialized.
  if (search.value !== nameOf(selected)) return;
  const q = new URLSearchParams({
    species: selected.id,
  });
  q.set("lang", language);
  if (clarified !== null) q.set("confirmedContext", clarified);
  if (cpText) q.set("cp", cpText);
  if (view === "reference") {
    q.set("view", view);
    q.set("refMode", referenceMode);
    const term = $<HTMLInputElement>("#reference-search").value;
    if (term) q.set("q", term);
  }
  history.replaceState(null, "", `?${q}`);
}
function render() {
  const number = /^\d+$/.test(cpText) ? Number(cpText) : 0;
  const analysis = analyzeShadowCatch(selected, number);
  if (clarified !== null && !analysis.matches.some((c) => c.id === clarified))
    clarified = null;
  const matches =
    clarified === null
      ? analysis.matches
      : analysis.matches.filter((c) => c.id === clarified);
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
  const weather = (boosted: boolean) => t(boosted ? "boosted" : "normal");
  const contextLabel = (c: (typeof analysis.contexts)[number]) =>
    `${t(c.encounter === "raid" ? "raid" : "rocketContext")} · ${weather(c.boosted)}`;
  const contextText = (c: (typeof analysis.contexts)[number]) =>
    `${contextLabel(c)} · ${t("level")} ${c.summary.raidLevel.level} · ${t("floor")} ${c.floor}/${c.floor}/${c.floor}`;
  const needsClarification = clarified === null && analysis.needsClarification;
  const committed = search.value === nameOf(selected);
  const alreadyPerfect = allMatchesAlreadyPerfect(matches);
  $("#species-meta").textContent = committed
    ? `#${String(selected.dex).padStart(3, "0")} · ${typesOf(selected)}`
    : t("select");
  $("#cp-context").hidden = !committed || !selected.shadow;
  $("#cp-context").textContent =
    !committed || !selected.shadow
      ? ""
      : cpText && matches.length === 1
        ? `${t("compatible")}: ${contextLabel(matches[0]!)}`
        : cpText && matches.length > 1
          ? t("contextsCount", { count: matches.length })
          : t("auto");
  let tone = "empty",
    icon = "◇",
    title = t("chooseTitle"),
    copy = t("chooseCopy");
  if (!committed) {
  } else if (!selected.shadow) {
    title = t("unavailableTitle");
    copy = t("unavailableCopy");
  } else if (cpText) {
    if (!/^\d+$/.test(cpText) || !Number.isSafeInteger(number) || number < 10) {
      tone = "invalid";
      icon = "?";
      title = t("invalidTitle");
      copy = t("invalidCopy");
    } else if (outcome === "unsupported") {
      tone = "invalid";
      icon = "?";
      title = t("unsupportedContextTitle");
      copy = t("unsupportedContextCopy");
    } else if (outcome === "invalid") {
      tone = "invalid";
      icon = "?";
      title = t("noMatchTitle");
      copy = t("noMatchCopy");
    } else if (outcome === "none") {
      tone = "none";
      icon = "−";
      title = t("noneTitle");
      copy = t("noneCopy");
    } else if (outcome === "all") {
      tone = "good";
      icon = "✓";
      title = t(alreadyPerfect ? "alreadyTitle" : "allTitle");
      copy = t(alreadyPerfect ? "alreadyCopy" : "allCopy");
    } else if (needsClarification) {
      tone = "mixed";
      icon = "?";
      const sameEncounter = new Set(matches.map((c) => c.encounter)).size === 1;
      title = t(sameEncounter ? "ambiguousTitle" : "contextTitle");
      copy = t(sameEncounter ? "ambiguousCopy" : "contextCopy");
    } else {
      tone = "mixed";
      icon = "◇";
      title = t("possibleTitle");
      copy = t("possibleCopy");
    }
  }
  const valid =
    committed &&
    !!cpText &&
    matches.length > 0 &&
    selected.shadow &&
    /^\d+$/.test(cpText) &&
    Number.isSafeInteger(number) &&
    number >= 10;
  const waiting = !cpText && committed && selected.shadow;
  input.setAttribute("aria-invalid", String(!!cpText && tone === "invalid"));
  $(".decision-column > .section-heading").hidden = waiting;
  $(".appraisal-tip").hidden = !valid || alreadyPerfect;
  $("#decision").className = `decision ${tone}`;
  const percentage = valid
    ? matches.length === 1
      ? chance(matches[0]!.summary, false, alreadyPerfect)
      : analysis.sameChance
        ? chance(matches[0]!.summary, true, alreadyPerfect)
        : `<div class="context-chances">${matches.map((c) => `<section><h3>${contextLabel(c)}</h3>${chance(c.summary, false, alreadyPerfect)}${needsClarification ? `<button class="clarify" data-clarify="${c.id}">${contextLabel(c)} →</button>` : ""}</section>`).join("")}<p class="field-note">${t("separate")}</p></div>`
    : "";
  $("#decision").innerHTML = waiting
    ? `<p class="empty-message">${t("empty")}</p>`
    : `<div class="decision-top"><span class="decision-icon" aria-hidden="true">${icon}</span><span class="eyebrow">${t("resultEyebrow")}</span></div><h2>${title}</h2>${percentage}<p>${copy}</p>${valid && alreadyPerfect ? `<p class="field-note battle-note">${t("battleNote")}</p>` : ""}${valid ? `<div class="result-context"><strong>${escape(nameOf(selected))} · ${language === "de" ? "WP" : "CP"} ${escape(cpText)}</strong><span>${matches.length === 1 ? `${t("compatible")}: ${contextLabel(matches[0]!)}` : t("both")}</span></div><details class="result-details"><summary>${t("details")}</summary>${matches.map((c) => `<section class="context-calculation"><h3>${contextText(c)}</h3><p>${t("equalRolls")}</p>${matches.length > 1 ? `<p>${t("matching", { good: c.summary.good, total: c.summary.total })} · ${formatPercent(c.summary.odds)}</p>` : ""}<p class="original-perfect"><strong>${t("already")}: ${formatPercent(c.summary.combos.filter(isOriginalPerfect).length / c.summary.total)}</strong><br>${t("originalCount", { good: c.summary.combos.filter(isOriginalPerfect).length, total: c.summary.total })}. ${t("alreadyHint")}</p>${spreads(c.summary)}</section>`).join("")}</details>` : ""}`;
  $("#decision")
    .querySelectorAll<HTMLButtonElement>("[data-clarify]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        clarified = b.dataset.clarify as ShadowContextId;
        render();
      }),
    );
  $("#watchlist").innerHTML = !committed
    ? `<p class="field-note">${t("chooseFirst")}</p>`
    : analysis.contexts
        .map(
          (c) =>
            `<h3>${contextLabel(c)}</h3><div class="cp-chips">${selected.shadow ? c.summary.watchlist.map((row) => `<button data-cp="${row.cp}"><strong>${row.cp}</strong><span>${row.good === row.total ? t("allMatches") : t("matches", { good: row.good, total: row.total })}</span></button>`).join("") : t("noShadow")}</div>`,
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
  if (committed) updateUrl();
}
function chance(summary: CpSummary, common = false, alreadyPerfect = false) {
  const label = t(alreadyPerfect ? "alreadyChanceLabel" : "chanceLabel");
  return `<section class="chance-panel" aria-label="${label}"><strong class="chance-value">${formatPercent(summary.odds)}</strong><div><span>${label}</span><small>${common ? t("sameChance") : t("matching", { good: summary.good, total: summary.total })}</small></div></section>`;
}
function isOriginalPerfect(c: { a: number; d: number; s: number }) {
  return c.a === 15 && c.d === 15 && c.s === 15;
}
function spreads(s: CpSummary) {
  return `<div class="iv-table-wrap${s.total > 16 ? " scrollable" : ""}"><table class="iv-table"><caption>${t("tableCaption")}</caption><thead><tr><th scope="col">${t("before")}</th><th scope="col">${t("after")}</th><th scope="col">${t("qualifies")}</th></tr></thead><tbody>${s.combos
    .slice()
    .sort((a, b) => Number(b.good) - Number(a.good))
    .map(
      (c) =>
        `<tr data-qualifies="${c.good}"><td><code>${c.a} / ${c.d} / ${c.s}</code></td><td><code>${c.purified.a} / ${c.purified.d} / ${c.purified.s}</code></td><td class="${c.good ? "qualifies" : ""}">${isOriginalPerfect(c) ? t("perfect") : t(c.good ? "yes" : "no")}</td></tr>`,
    )
    .join("")}</tbody></table></div>`;
}
let referenceLimit = 40;
let referenceMode = params.get("refMode") === "raid" ? "raid" : "rocket";
const referenceCache = new Map<string, ReturnType<typeof perfectReference>>();
function referenceFor(
  p: Species,
  group: string,
  boosted: boolean,
  normalRaid = false,
) {
  const level = (group === "rocket" ? ROCKET_LEVELS : RAID_LEVELS)[
    boosted ? 1 : 0
  ]!;
  const floor =
    group === "rocket" ? (boosted ? 4 : 0) : normalRaid || !p.shadow ? 10 : 6;
  const key = `${p.id}-${level.level}-${floor}`;
  if (!referenceCache.has(key))
    referenceCache.set(key, perfectReference(p, level, floor));
  return referenceCache.get(key)!;
}
function referenceCell(p: Species, group: string, boosted: boolean) {
  const r = referenceFor(p, group, boosted),
    supported = group !== "rocket" || (p.shadow && p.rocketModelSupported);
  const collision = supported && r.collision,
    context = `${t(group === "rocket" ? "referenceRocket" : "referenceRaids")} · ${t(boosted ? "boosted" : "normal")}`;
  const hint = t("collisionHint", { cp: r.cp, count: r.matches.length }),
    id = `hint-${p.id}-${group}-${boosted}`;
  return `<td data-reference-group="${group}"><button class="cp-reference" data-cp-species="${p.id}" data-cp-group="${group}" data-cp-boosted="${boosted}" data-ambiguous="${collision}" aria-label="${escape(nameOf(p))} · ${context} · ${language === "de" ? "WP" : "CP"} ${r.cp}${collision ? " · " + escape(hint) : ""}" ${collision ? `aria-describedby="${id}"` : ""}><span class="cp-value"><span class="cp-number">${r.cp}</span></span>${collision ? `<span id="${id}" class="collision-explanation" role="tooltip">${hint}</span>` : ""}</button></td>`;
}
const referenceDialog = $<HTMLDialogElement>("#reference-dialog");
$("#reference-dialog-close").addEventListener("click", () =>
  referenceDialog.close(),
);
function showReference(p: Species, group: string, boosted: boolean) {
  const r = referenceFor(p, group, boosted),
    supported = group !== "rocket" || (p.shadow && p.rocketModelSupported);
  const context =
    group === "rocket"
      ? t("referenceRocket")
      : t(p.shadow ? "shadowRaidRef" : "normalRaidRef");
  $("#reference-dialog-title").textContent = `${nameOf(p)} · ${language === "de" ? "WP" : "CP"} ${r.cp}`;
  $("#reference-dialog-content").innerHTML =
    `<p>${context} · ${t(boosted ? "boosted" : "normal")}</p>${supported ? `<p class="combination-count">${t(r.matches.length === 1 ? "combinationOne" : "combinationCount", { count: r.matches.length })}</p><div class="reference-matches"><table class="reference-ivs"><caption class="sr-only">${t("matchingIvs")}</caption><thead><tr><th scope="col">${t("ivAttack")}</th><th scope="col">${t("ivDefense")}</th><th scope="col">${t("ivHp")}</th></tr></thead><tbody>${r.matches.map((c) => `<tr data-perfect="${isOriginalPerfect(c)}"><td>${c.a}</td><td>${c.d}</td><td>${c.s}</td></tr>`).join("")}</tbody></table></div><details class="reference-assumptions"><summary>${t("calculationAssumptions")}</summary><p>${t("referenceFloor", { level: r.level, floor: r.floor })}</p><p>${t(r.collision ? "collisionHint" : "referenceUnique", { cp: r.cp, count: r.matches.length })}</p>${group === "raid" && p.shadow ? `<p>${t("normalComparison", { count: referenceFor(p, group, boosted, true).matches.length })}</p>` : ""}</details>` : `<p>${t("refUnsupported")}</p>`}<button id="use-reference-cp" class="secondary">${t("useCp")}</button>`;
  $("#use-reference-cp").addEventListener("click", () => {
    referenceDialog.close();
    choose(p.id);
    cpText = String(r.cp);
    input.value = cpText;
    clarified = null;
    render();
    setView("check");
    input.focus();
  });
  referenceDialog.showModal();
}
function setReferenceMode(mode: string) {
  referenceMode = mode;
  $(".reference-table").dataset.mode = mode;
  document
    .querySelectorAll<HTMLButtonElement>("[data-ref-mode]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.refMode === mode)),
    );
}
document.querySelectorAll<HTMLButtonElement>("[data-ref-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    setReferenceMode(b.dataset.refMode!);
    updateUrl();
  }),
);
setReferenceMode(referenceMode);
function renderReference() {
  const results = matchSpecies(
    $<HTMLInputElement>("#reference-search").value.trim(),
  );
  $("#reference-count").textContent = t("count", {
    shown: Math.min(referenceLimit, results.length),
    total: results.length.toLocaleString(language),
  });
  $("#reference-rows").innerHTML =
    results
      .slice(0, referenceLimit)
      .map(
        (p) =>
          `<tr><th scope="row"><button class="species-reference" data-reference="${p.id}">${escape(nameOf(p))}</button><small>#${String(p.dex).padStart(3, "0")} · ${typesOf(p)}</small></th>${["rocket", "raid"].map((group) => [false, true].map((boosted) => referenceCell(p, group, boosted)).join("")).join("")}</tr>`,
      )
      .join("") || `<tr><td colspan="5">${t("noResults")}</td></tr>`;
  $("#load-more").hidden = referenceLimit >= results.length;
  $("#reference-rows")
    .querySelectorAll<HTMLButtonElement>("[data-reference]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        choose(b.dataset.reference!);
        setView("check");
        search.focus();
        closeSuggestions();
      }),
    );
  $("#reference-rows")
    .querySelectorAll<HTMLButtonElement>("[data-cp-species]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        showReference(
          all.find((p) => p.id === b.dataset.cpSpecies)!,
          b.dataset.cpGroup!,
          b.dataset.cpBoosted === "true",
        ),
      ),
    );
}
$<HTMLInputElement>("#reference-search").addEventListener("input", () => {
  referenceLimit = 40;
  renderReference();
  updateUrl();
});
$("#load-more").addEventListener("click", () => {
  referenceLimit += 40;
  renderReference();
  updateUrl();
});
function setView(next: string) {
  view = next;
  $("#check-view").hidden = view !== "check";
  $("#reference-view").hidden = view !== "reference";
  const skip = document.querySelector<HTMLAnchorElement>(".skip")!;
  skip.href = view === "reference" ? "#reference-heading" : "#decision";
  skip.textContent = t(view === "reference" ? "skipReference" : "skip");
  document
    .querySelectorAll<HTMLButtonElement>("[data-view]")
    .forEach((b) =>
      b.setAttribute(
        "aria-current",
        b.dataset.view === view ? "page" : "false",
      ),
    );
  if (search.value === nameOf(selected)) updateUrl();
}
document
  .querySelectorAll<HTMLButtonElement>("[data-view]")
  .forEach((b) => b.addEventListener("click", () => setView(b.dataset.view!)));
document.querySelector<HTMLAnchorElement>(".skip")!.addEventListener("click", event => {
  event.preventDefault();
  const target = $(view === "reference" ? "#reference-heading" : "#decision");
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "start" });
});
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
$<HTMLInputElement>("#reference-search").value = params.get("q") ?? "";
document.querySelectorAll<HTMLButtonElement>("[data-language]").forEach((b) =>
  b.addEventListener("click", () => {
    const next = b.dataset.language!;
    try {
      localStorage.setItem("hundo-check-language", next);
    } catch {}
    updateUrl();
    const url = new URL(location.href);
    url.searchParams.set("lang", next);
    location.assign(url);
  }),
);
render();
renderReference();
setView(view);
if (
  "serviceWorker" in navigator &&
  !["127.0.0.1", "localhost"].includes(location.hostname)
) {
  const registerOfflineWorker = () =>
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {});
  // main is dynamically imported: slow networks can finish that import after
  // load has already fired, so a load-only listener misses registration.
  if (document.readyState === "complete") void registerOfflineWorker();
  else window.addEventListener("load", registerOfflineWorker, { once: true });
}

recordTraffic("checker");
