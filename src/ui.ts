import catalog from "./catalog.json";
import { t, language, nameOf } from "./i18n";
const e = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function shell() {
  return `
<header class="site-header"><a class="brand" href="./" aria-label="${t("home")}"><span class="brand-mark" aria-hidden="true">IV</span> Hundo<span>Check</span></a><div class="language-toggle" role="group" aria-label="${t("language")}"><button data-language="en" aria-pressed="${language === "en"}" lang="en">English</button><button data-language="ja" aria-pressed="${language === "ja"}" lang="ja">日本語</button></div><button class="theme-button" aria-label="${t("theme")}">◐</button></header>
<main><div class="intro"><p class="eyebrow">${t("guide")}</p><h1>${t("title")}</h1></div>
<nav class="view-tabs" aria-label="${t("tools")}"><button data-view="check">${t("checker")}</button><button data-view="reference">${t("reference")}</button></nav>
<section id="check-view"><div class="workspace"><section class="input-card" aria-labelledby="setup-heading"><div class="section-heading"><h2 id="setup-heading">${t("encounter")}</h2></div>
<div class="primary-inputs"><div><label for="species-search">${t("pokemon")}</label><div class="species-picker"><input id="species-search" type="search" autocomplete="off" placeholder="${t("search")}" role="combobox" aria-expanded="false" aria-controls="species-list" aria-autocomplete="list"/><div id="species-list" role="listbox" aria-label="${t("searchResults")}" hidden></div></div></div><div><label for="cp-input">${t("catchCp")}</label><div class="cp-entry"><input id="cp-input" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="CP" aria-describedby="cp-context"/></div></div></div>
<p id="species-meta" class="field-note"></p><div class="quick-picks" aria-label="${t("quick")}">${["MEWTWO", "RATTATA", "MAGIKARP", "BULBASAUR"].map((id) => `<button data-species="${id}">${e(nameOf(catalog.pokemon.find((p) => p.id === id)!))}</button>`).join("")}</div>
<fieldset><legend>${t("where")}</legend><div class="segmented"><button data-encounter="raid">${t("raid")}</button><button data-encounter="rocket">${t("rocket")}<small>${t("grunt")}</small></button></div></fieldset><p id="cp-context" class="field-note"></p></section>
<section class="decision-column"><div class="section-heading"><h2>${t("result")}</h2></div><div id="decision" role="status" aria-live="polite" aria-atomic="true" tabindex="-1"></div><p class="appraisal-tip">${t("appraisal")}</p></section></div>
<details class="disclosure watch"><summary><span><strong>${t("watch")}</strong><small>${t("watchHint")}</small></span><span aria-hidden="true">+</span></summary><div id="watchlist"></div></details></section>
<section id="reference-view" hidden aria-labelledby="reference-heading"><div class="reference-intro"><h2 id="reference-heading">${t("referenceTitle")}</h2><p>${t("referenceIntro")}</p></div><div class="context-note">${t("referenceNote")}</div><label for="reference-search" class="sr-only">${t("referenceSearchLabel")}</label><input id="reference-search" type="search" placeholder="${t("referenceSearch")}" autocomplete="off"/><p id="reference-count" class="field-note" aria-live="polite"></p><div class="reference-table"><table><thead><tr><th scope="col">${t("pokemon")}</th><th scope="col">${t("normal")}</th><th scope="col">${t("boosted")}</th><th scope="col"><span class="sr-only">${t("action")}</span></th></tr></thead><tbody id="reference-rows"></tbody></table></div><button id="load-more" class="secondary">${t("more")}</button><p class="field-note">${t("referenceScope")}</p></section>
<details class="disclosure"><summary><span><strong>${t("how")}</strong><small>${t("howHint")}</small></span><span aria-hidden="true">+</span></summary><div class="notes"><h3>${t("howTitle")}</h3><p>${t("mechanic")}</p><p>${t("enumeration")}</p><p>${t("assumption")}</p><h3>${t("scope")}</h3><p>${t("source")}</p><p>${t("sourceCount", { count: catalog.pokemon.length, date: catalog.generated })} · <a href="https://github.com/pvpoke/pvpoke/tree/${catalog.revision}">PvPoke</a> / <a href="https://github.com/PokeAPI/pokeapi/tree/2bf639e5572812a67d2b94903fdcb9d095f5aeb2">PokeAPI</a></p><p><a href="./advanced.html?lang=${language}">${t("advanced")} →</a> ${t("advancedHint")}</p></div></details>
<footer><span>${t("local")}</span><div><a href="./privacy.html">${t("privacy")}</a><a href="https://github.com/Doomsday126dev/raid-iv-odds/issues/new">${t("feedback")}</a></div><p>${t("legal")}</p></footer></main>`;
}
