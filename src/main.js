import { DATA_LAST_REVIEWED, POKEMON } from "./data.js";
import { MAX_IV, MIN_CP, RAID_LEVELS, clampInt, formatPercent, formatRatio, maxCpFor, purifiedThreshold, summarizeCp } from "./math.js";
const STORAGE_KEY = "raidIvOdds:v4";
const DEFAULT_PREFS = {
    theme: "system",
    accent: "aqua",
    density: "comfortable",
    showDetails: true,
    watchFilter: "all"
};
const elements = {
    pokemonSelect: byId("pokemonSelect"),
    cpInput: byId("cpInput"),
    cpValidation: byId("cpValidation"),
    normalMaxButton: byId("normalMaxButton"),
    boostedMaxButton: byId("boostedMaxButton"),
    manualStats: byId("manualStats"),
    atkInput: byId("atkInput"),
    defInput: byId("defInput"),
    staInput: byId("staInput"),
    floorInput: byId("floorInput"),
    floorHint: byId("floorHint"),
    bonusInput: byId("bonusInput"),
    bonusHint: byId("bonusHint"),
    showDetails: byId("showDetails"),
    watchFilter: byId("watchFilter"),
    densitySelect: byId("densitySelect"),
    installButton: byId("installButton"),
    hundoHints: byId("hundoHints"),
    primaryInsight: byId("primaryInsight"),
    contextStrip: byId("contextStrip"),
    resultsGrid: byId("resultsGrid"),
    watchlistGrid: byId("watchlistGrid"),
    dataHint: byId("dataHint"),
    themeButtons: Array.from(document.querySelectorAll("[data-theme-choice]")),
    accentButtons: Array.from(document.querySelectorAll("[data-accent-choice]")),
    cpStepButtons: Array.from(document.querySelectorAll("[data-cp-step]")),
    themeMeta: document.querySelector('meta[name="theme-color"]')
};
let prefs = {
    ...DEFAULT_PREFS
};
let deferredInstallPrompt = null;
function init() {
    populatePokemonSelect();
    restoreState();
    applyAppearance();
    bindEvents();
    registerServiceWorker();
    render();
}
function populatePokemonSelect() {
    elements.pokemonSelect.innerHTML = POKEMON.map((pokemon)=>`<option value="${escapeHtml(pokemon.name)}">${escapeHtml(pokemon.name)}</option>`).join("");
}
function restoreState() {
    const saved = {
        ...loadSavedState(),
        ...loadStateFromUrl()
    };
    const savedPokemon = typeof saved.selectedName === "string" && POKEMON.some((pokemon)=>pokemon.name === saved.selectedName) ? saved.selectedName : "Mewtwo";
    prefs = {
        ...DEFAULT_PREFS,
        theme: validateOption(saved.theme, [
            "system",
            "light",
            "dark"
        ], DEFAULT_PREFS.theme),
        accent: validateOption(saved.accent, [
            "aqua",
            "mystic",
            "valor",
            "instinct"
        ], DEFAULT_PREFS.accent),
        density: validateOption(saved.density, [
            "comfortable",
            "compact"
        ], DEFAULT_PREFS.density),
        showDetails: typeof saved.showDetails === "boolean" ? saved.showDetails : DEFAULT_PREFS.showDetails,
        watchFilter: validateOption(saved.watchFilter, [
            "all",
            "partial",
            "strong",
            "guaranteed"
        ], DEFAULT_PREFS.watchFilter)
    };
    elements.pokemonSelect.value = savedPokemon;
    elements.manualStats.checked = Boolean(saved.manualStats);
    if (elements.manualStats.checked && saved.stats) {
        elements.atkInput.value = String(clampInt(saved.stats.atk, 1, 999, selectedPokemon().atk));
        elements.defInput.value = String(clampInt(saved.stats.def, 1, 999, selectedPokemon().def));
        elements.staInput.value = String(clampInt(saved.stats.sta, 1, 999, selectedPokemon().sta));
        syncManualState();
    } else {
        syncStatsToSelected();
    }
    elements.floorInput.value = String(clampInt(saved.raidFloor, 0, MAX_IV, 6));
    elements.bonusInput.value = String(clampInt(saved.purifyBonus, 0, MAX_IV, 2));
    elements.cpInput.value = Number.isFinite(Number(saved.cp)) && Number(saved.cp) >= MIN_CP ? String(clampInt(saved.cp, MIN_CP, 99999, MIN_CP)) : String(maxCpFor(readBaseStats(), RAID_LEVELS[0]));
    elements.showDetails.checked = prefs.showDetails;
    elements.watchFilter.value = prefs.watchFilter;
    elements.densitySelect.value = prefs.density;
}
function bindEvents() {
    elements.pokemonSelect.addEventListener("change", ()=>{
        syncStatsToSelected();
        render();
    });
    elements.manualStats.addEventListener("change", ()=>{
        if (!elements.manualStats.checked) syncStatsToSelected();
        syncManualState();
        render();
    });
    [
        elements.cpInput,
        elements.atkInput,
        elements.defInput,
        elements.staInput,
        elements.floorInput,
        elements.bonusInput
    ].forEach((input)=>input.addEventListener("input", render));
    elements.showDetails.addEventListener("change", ()=>{
        prefs.showDetails = elements.showDetails.checked;
        render();
    });
    elements.watchFilter.addEventListener("change", ()=>{
        prefs.watchFilter = elements.watchFilter.value;
        render();
    });
    elements.densitySelect.addEventListener("change", ()=>{
        prefs.density = elements.densitySelect.value;
        applyAppearance();
        render();
    });
    elements.normalMaxButton.addEventListener("click", ()=>{
        elements.cpInput.value = String(maxCpFor(readBaseStats(), RAID_LEVELS[0]));
        render();
    });
    elements.boostedMaxButton.addEventListener("click", ()=>{
        elements.cpInput.value = String(maxCpFor(readBaseStats(), RAID_LEVELS[1]));
        render();
    });
    elements.cpStepButtons.forEach((button)=>{
        button.addEventListener("click", ()=>{
            const delta = Number(button.dataset.cpStep);
            const nextCp = clampInt(elements.cpInput.value, MIN_CP, 99999, MIN_CP) + delta;
            elements.cpInput.value = String(clampInt(nextCp, MIN_CP, 99999, MIN_CP));
            render();
        });
    });
    elements.themeButtons.forEach((button)=>{
        button.addEventListener("click", ()=>{
            prefs.theme = button.dataset.themeChoice;
            applyAppearance();
            render();
        });
    });
    elements.accentButtons.forEach((button)=>{
        button.addEventListener("click", ()=>{
            prefs.accent = button.dataset.accentChoice;
            applyAppearance();
            render();
        });
    });
    const handleCpButtonClick = (event)=>{
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest("[data-cp]");
        if (!button) return;
        elements.cpInput.value = button.dataset.cp ?? String(MIN_CP);
        render();
        elements.resultsGrid.scrollIntoView({
            block: "start",
            behavior: "smooth"
        });
    };
    elements.resultsGrid.addEventListener("click", handleCpButtonClick);
    elements.watchlistGrid.addEventListener("click", handleCpButtonClick);
    elements.contextStrip.addEventListener("click", (event)=>{
        if (!(event.target instanceof Element) || !event.target.closest("[data-focus-cp]")) return;
        elements.cpInput.focus();
        elements.cpInput.select();
    });
    window.addEventListener("beforeinstallprompt", (event)=>{
        event.preventDefault();
        deferredInstallPrompt = event;
        elements.installButton.hidden = false;
    });
    elements.installButton.addEventListener("click", async ()=>{
        if (!deferredInstallPrompt) return;
        await deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        elements.installButton.hidden = true;
    });
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = ()=>{
        if (prefs.theme === "system") applyAppearance();
    };
    systemThemeQuery.addEventListener("change", handleSystemThemeChange);
}
function selectedPokemon() {
    return POKEMON.find((pokemon)=>pokemon.name === elements.pokemonSelect.value) || POKEMON[0];
}
function syncStatsToSelected() {
    const pokemon = selectedPokemon();
    elements.atkInput.value = String(pokemon.atk);
    elements.defInput.value = String(pokemon.def);
    elements.staInput.value = String(pokemon.sta);
    syncManualState();
}
function syncManualState() {
    const disabled = !elements.manualStats.checked;
    elements.atkInput.disabled = disabled;
    elements.defInput.disabled = disabled;
    elements.staInput.disabled = disabled;
}
function readBaseStats() {
    const selected = selectedPokemon();
    return {
        atk: clampInt(elements.atkInput.value, 1, 999, selected.atk),
        def: clampInt(elements.defInput.value, 1, 999, selected.def),
        sta: clampInt(elements.staInput.value, 1, 999, selected.sta)
    };
}
function readSettings() {
    return {
        baseStats: readBaseStats(),
        cp: clampInt(elements.cpInput.value, MIN_CP, 99999, MIN_CP),
        raidFloor: clampInt(elements.floorInput.value, 0, MAX_IV, 6),
        purifyBonus: clampInt(elements.bonusInput.value, 0, MAX_IV, 2)
    };
}
function render() {
    const settings = readSettings();
    const summaries = RAID_LEVELS.map((raidLevel)=>summarizeCp(settings.baseStats, raidLevel, settings.cp, settings.raidFloor, settings.purifyBonus));
    renderQuickButtons(settings.baseStats);
    renderHundoHints(settings.baseStats);
    renderCpValidation(summaries, settings);
    renderPrimaryInsight(summaries, settings);
    renderAssumptionHints(settings);
    renderDataHint();
    elements.resultsGrid.innerHTML = summaries.map(renderResultPanel).join("");
    elements.watchlistGrid.innerHTML = summaries.map(renderWatchlistPanel).join("");
    updateControlState();
    saveState(settings);
    syncUrl(settings);
}
function renderQuickButtons(baseStats) {
    elements.normalMaxButton.textContent = `Use non-weather hundo ${maxCpFor(baseStats, RAID_LEVELS[0])}`;
    elements.boostedMaxButton.textContent = `Use weather-boosted hundo ${maxCpFor(baseStats, RAID_LEVELS[1])}`;
}
function renderHundoHints(baseStats) {
    elements.hundoHints.innerHTML = `
    <span class="hundo-hint-label">Selected boss hundo CPs</span>
    <span class="hundo-hint-values"><span>Non-weather</span> <strong>${maxCpFor(baseStats, RAID_LEVELS[0])}</strong></span>
    <span class="hundo-hint-values"><span>Weather boosted</span> <strong>${maxCpFor(baseStats, RAID_LEVELS[1])}</strong></span>
  `;
}
function renderCpValidation(summaries, settings) {
    const possible = summaries.filter((summary)=>summary.total > 0);
    const inRange = summaries.filter((summary)=>settings.cp >= summary.minCp && settings.cp <= summary.maxCp);
    const ranges = summaries.map((summary)=>`${summary.raidLevel.label}: ${summary.minCp}-${summary.maxCp}`).join(" · ");
    const possibleClass = possible.length ? "is-valid" : "is-invalid";
    elements.cpInput.min = String(Math.min(...summaries.map((summary)=>summary.minCp)));
    elements.cpInput.max = String(Math.max(...summaries.map((summary)=>summary.maxCp)));
    elements.cpInput.setAttribute("aria-invalid", String(!possible.length));
    if (possible.length === 1) {
        const match = possible[0];
        const outcome = match.good ? `${match.good}/${match.total} purify to hundo (${formatPercent(match.odds)}).` : "possible CP, but no matching spread purifies to hundo.";
        elements.cpInput.setCustomValidity("");
        elements.cpValidation.className = `field-help cp-validation ${possibleClass}`;
        elements.cpValidation.textContent = `${match.raidLevel.label} match. ${outcome}`;
        return;
    }
    if (possible.length > 1) {
        elements.cpInput.setCustomValidity("");
        elements.cpValidation.className = `field-help cp-validation ${possibleClass}`;
        elements.cpValidation.textContent = `Rare overlap: this CP appears in ${possible.map((summary)=>summary.raidLevel.label.toLowerCase()).join(" and ")} tables. Check the raid weather state.`;
        return;
    }
    const nearest = summaries.flatMap((summary)=>nearestPossibleCpButtons(summary, settings.cp)).slice(0, 3).join(" ");
    const message = inRange.length ? `Within the selected boss range, but no IV spread lands exactly on ${settings.cp}.` : `Outside the selected boss catch ranges. ${ranges}.`;
    elements.cpInput.setCustomValidity(message);
    elements.cpValidation.className = `field-help cp-validation ${possibleClass}`;
    elements.cpValidation.innerHTML = `${escapeHtml(message)}${nearest ? ` Try ${nearest}` : ""}`;
}
function nearestPossibleCpButtons(summary, cp) {
    return Array.from(summary.buckets.keys()).sort((left, right)=>Math.abs(left - cp) - Math.abs(right - cp) || right - left).slice(0, 2).map((candidate)=>`<button class="inline-cp-button" type="button" data-cp="${candidate}">${candidate}</button>`);
}
function renderDataHint() {
    elements.dataHint.innerHTML = `Seeded list: ${POKEMON.length} bosses/forms, reviewed ${DATA_LAST_REVIEWED}. Use manual stats for brand-new or missing forms.`;
}
function renderAssumptionHints(settings) {
    const threshold = purifiedThreshold(settings.purifyBonus);
    const floorLabel = `${settings.raidFloor}/${settings.raidFloor}/${settings.raidFloor}`;
    const targetLabel = `${threshold}/${threshold}/${threshold}+`;
    elements.floorHint.textContent = `Counts every spread from ${floorLabel} through 15/15/15.`;
    elements.bonusHint.textContent = `With +${settings.purifyBonus}, pre-purify ${targetLabel} reaches a hundo.`;
}
function renderPrimaryInsight(summaries, settings) {
    const eligible = summaries.filter((summary)=>summary.total && summary.good);
    const possible = summaries.filter((summary)=>summary.total);
    const best = eligible.slice().sort((left, right)=>right.odds - left.odds)[0];
    let state = "none";
    let title = "CP not possible";
    let copy = `No level 20 or level 25 IV spread can produce CP ${settings.cp} for this Pokemon.`;
    if (best) {
        state = best.odds === 1 ? "good" : "mixed";
        title = `${formatPercent(best.odds)} chance`;
        copy = `${best.raidLevel.label}: ${best.good}/${best.total} matching IV spreads purify to 15/15/15.`;
    } else if (possible.length) {
        title = "0% chance";
        copy = `${possible.map((summary)=>summary.raidLevel.label).join(" and ")} can produce this CP, but none of the matching spreads purify to 15/15/15.`;
    }
    elements.primaryInsight.className = `primary-insight ${state}`;
    elements.primaryInsight.innerHTML = `
    <span class="insight-label">CP result</span>
    <span class="insight-title">${title}</span>
    <p class="insight-copy">${copy}</p>
  `;
    const threshold = purifiedThreshold(settings.purifyBonus);
    const pokemon = selectedPokemon();
    elements.contextStrip.innerHTML = `
    <div class="context-card"><span>Pokemon</span><strong>${escapeHtml(pokemon.name)}</strong></div>
    <button class="context-card context-button" type="button" data-focus-cp><span>Analyzing CP</span><strong>${settings.cp}</strong><em>Tap to edit</em></button>
    <div class="context-card"><span>IV floor</span><strong>${settings.raidFloor}/${settings.raidFloor}/${settings.raidFloor}</strong></div>
    <div class="context-card"><span>Pre-purify target</span><strong>${threshold}/${threshold}/${threshold}+</strong></div>
    <div class="context-card"><span>Base stats</span><strong>${settings.baseStats.atk}/${settings.baseStats.def}/${settings.baseStats.sta}</strong></div>
  `;
}
function renderResultPanel(summary) {
    const state = resultState(summary);
    const badgeClass = summary.good === summary.total && summary.total ? "is-full" : summary.good ? "" : "is-zero";
    const nearest = renderNearest(summary);
    return `
    <article class="result-panel is-${state.kind}" data-testid="${summary.raidLevel.key}-result">
      <div class="result-head">
        <div>
          <h2>${summary.raidLevel.label}</h2>
          <p class="scenario-copy">Catch level ${summary.raidLevel.level}; CP range ${summary.minCp}-${summary.maxCp}</p>
        </div>
        <div class="odds-badge ${badgeClass}">
          <span class="odds-value">${formatPercent(summary.odds)}</span>
          <span class="odds-ratio">${summary.total ? `${summary.good}/${summary.total}` : "0/0"}</span>
        </div>
      </div>

      <div class="odds-meter" aria-hidden="true"><span style="width: ${Math.max(0, summary.odds * 100)}%"></span></div>
      <p class="status-line ${state.kind}">${state.message}${nearest}</p>

      <div class="stat-row" aria-label="${summary.raidLevel.label} CP details">
        <div class="stat-item">
          <span>Matching spreads</span>
          <strong>${summary.total}</strong>
        </div>
        <div class="stat-item">
          <span>Purify hundos</span>
          <strong>${summary.good}</strong>
        </div>
        <div class="stat-item">
          <span>Misses</span>
          <strong>${summary.bad}</strong>
        </div>
        <div class="stat-item">
          <span>Reduced odds</span>
          <strong>${formatRatio(summary.good, summary.total)}</strong>
        </div>
      </div>

      ${renderCombos(summary)}
    </article>
  `;
}
function resultState(summary) {
    if (!summary.total) {
        return {
            kind: "none",
            message: `CP ${summary.cp} is not possible for this Pokemon at level ${summary.raidLevel.level} with the current IV floor. `
        };
    }
    if (!summary.good) {
        return {
            kind: "none",
            message: `CP ${summary.cp} is possible, but none of its ${summary.total} IV spread${summary.total === 1 ? "" : "s"} purify to 100%. `
        };
    }
    if (summary.good === summary.total) {
        return {
            kind: "good",
            message: `Every IV spread that can produce CP ${summary.cp} purifies to 100%.`
        };
    }
    return {
        kind: "mixed",
        message: `CP ${summary.cp} has ${summary.total} possible IV spreads; ${summary.good} purif${summary.good === 1 ? "ies" : "y"} to 100%.`
    };
}
function renderNearest(summary) {
    if (summary.total && summary.good) return "";
    if (!summary.nearestEligible.length) return "No eligible CPs exist under these settings.";
    const chips = summary.nearestEligible.map((row)=>`<button class="chip-button" type="button" data-cp="${row.cp}">${row.cp} (${formatPercent(row.odds)})</button>`).join("");
    return `<span class="nearest-list">Closest eligible CPs: ${chips}</span>`;
}
function renderCombos(summary) {
    if (!summary.total) return "";
    const combos = summary.combos.slice().sort((left, right)=>Number(right.good) - Number(left.good) || sumIvs(right) - sumIvs(left)).map(renderComboPill).join("");
    return `
    <div class="combo-area" ${prefs.showDetails ? "" : "hidden"}>
      <div class="combo-head">
        <span>Matching IV spreads</span>
        <span>${summary.good} good / ${summary.bad} miss</span>
      </div>
      <div class="combo-list">${combos}</div>
    </div>
  `;
}
function renderComboPill(combo) {
    const original = `${combo.a}/${combo.d}/${combo.s}`;
    const purified = `${combo.purified.a}/${combo.purified.d}/${combo.purified.s}`;
    return `
    <span class="combo-pill ${combo.good ? "good" : "bad"}" title="${original} purifies to ${purified}">
      ${original}${combo.good ? " -> 100%" : ""}
    </span>
  `;
}
function renderWatchlistPanel(summary) {
    const filteredRows = filterWatchlist(summary.watchlist);
    const guaranteed = filteredRows.filter((row)=>row.good === row.total).length;
    const rows = filteredRows.map(renderWatchlistRow).join("");
    return `
    <details class="watch-panel" data-testid="${summary.raidLevel.key}-watchlist">
      <summary class="watch-head">
        <div>
          <h2>${summary.raidLevel.label} Watchlist</h2>
          <p>Tap to view CPs that have at least one spread that purifies to 15/15/15.</p>
        </div>
        <span class="watch-summary">${filteredRows.length}/${summary.watchlist.length} CPs, ${guaranteed} guaranteed</span>
      </summary>
      ${rows ? `<div class="watch-table" role="table" aria-label="${summary.raidLevel.label} eligible CPs">
              <div class="watch-table-head" role="row">
                <span>CP</span>
                <span>Chance</span>
                <span>Good/Total</span>
                <span>Good IVs</span>
              </div>
              <div class="watch-table-body">${rows}</div>
            </div>` : `<p class="empty-state">No CPs match this watchlist filter.</p>`}
    </details>
  `;
}
function renderWatchlistRow(row) {
    const oddsClass = row.good === row.total ? "full" : "partial";
    const comboPreview = previewGoodCombos(row.goodCombos);
    return `
    <button class="watch-row" type="button" data-cp="${row.cp}" role="row" aria-label="Analyze CP ${row.cp}, ${formatPercent(row.odds)} chance">
      <span class="watch-row-cp">${row.cp}</span>
      <span class="odds-token ${oddsClass}">${formatPercent(row.odds)}</span>
      <span class="watch-row-ratio">${row.good}/${row.total}</span>
      <span class="watch-row-combos">${escapeHtml(comboPreview)}</span>
    </button>
  `;
}
function filterWatchlist(rows) {
    if (prefs.watchFilter === "partial") return rows.filter((row)=>row.good > 0 && row.good < row.total);
    if (prefs.watchFilter === "strong") return rows.filter((row)=>row.odds >= 0.5);
    if (prefs.watchFilter === "guaranteed") return rows.filter((row)=>row.good === row.total);
    return [
        ...rows
    ];
}
function previewGoodCombos(combos) {
    const sorted = combos.slice().sort((left, right)=>sumIvs(left) - sumIvs(right));
    const visible = sorted.slice(0, 3).map((combo)=>`${combo.a}/${combo.d}/${combo.s}`).join(", ");
    const hidden = sorted.length - 3;
    return hidden > 0 ? `${visible}, +${hidden}` : visible;
}
function applyAppearance() {
    const resolvedTheme = prefs.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : prefs.theme === "system" ? "light" : prefs.theme;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.mode = prefs.theme;
    document.documentElement.dataset.accent = prefs.accent;
    document.documentElement.dataset.density = prefs.density;
    const themeColor = resolvedTheme === "dark" ? "#101417" : accentThemeColor(prefs.accent);
    elements.themeMeta?.setAttribute("content", themeColor);
    updateControlState();
}
function updateControlState() {
    elements.themeButtons.forEach((button)=>{
        button.setAttribute("aria-pressed", String(button.dataset.themeChoice === prefs.theme));
    });
    elements.accentButtons.forEach((button)=>{
        button.setAttribute("aria-pressed", String(button.dataset.accentChoice === prefs.accent));
    });
    elements.showDetails.checked = prefs.showDetails;
    elements.watchFilter.value = prefs.watchFilter;
    elements.densitySelect.value = prefs.density;
}
function saveState(settings) {
    const state = {
        selectedName: elements.pokemonSelect.value,
        cp: settings.cp,
        manualStats: elements.manualStats.checked,
        stats: settings.baseStats,
        raidFloor: settings.raidFloor,
        purifyBonus: settings.purifyBonus,
        theme: prefs.theme,
        accent: prefs.accent,
        density: prefs.density,
        showDetails: prefs.showDetails,
        watchFilter: prefs.watchFilter
    };
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch  {}
}
function loadSavedState() {
    try {
        return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch  {
        return {};
    }
}
function loadStateFromUrl() {
    const state = {};
    const query = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith("#?") ? new URLSearchParams(window.location.hash.slice(2)) : null;
    const params = hash && Array.from(hash.keys()).length ? hash : query;
    const pokemon = params.get("pokemon") || params.get("boss");
    const cp = params.get("cp");
    const floor = params.get("floor");
    const bonus = params.get("bonus");
    if (pokemon && POKEMON.some((entry)=>entry.name.toLowerCase() === pokemon.toLowerCase())) {
        state.selectedName = POKEMON.find((entry)=>entry.name.toLowerCase() === pokemon.toLowerCase())?.name || pokemon;
    }
    if (cp) state.cp = clampInt(cp, MIN_CP, 99999, MIN_CP);
    if (floor) state.raidFloor = clampInt(floor, 0, MAX_IV, 6);
    if (bonus) state.purifyBonus = clampInt(bonus, 0, MAX_IV, 2);
    return state;
}
function syncUrl(settings) {
    const params = new URLSearchParams();
    params.set("pokemon", selectedPokemon().name);
    params.set("cp", String(settings.cp));
    if (settings.raidFloor !== 6) params.set("floor", String(settings.raidFloor));
    if (settings.purifyBonus !== 2) params.set("bonus", String(settings.purifyBonus));
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
        window.history.replaceState(null, "", nextUrl);
    }
}
function registerServiceWorker() {
    const isProductionBuild = typeof import.meta.env === "object" && Boolean(import.meta.env.PROD);
    if (!isProductionBuild || !("serviceWorker" in navigator)) return;
    const baseUrl = typeof import.meta.env === "object" ? import.meta.env.BASE_URL : "/";
    navigator.serviceWorker.register(`${baseUrl}sw.js`, {
        scope: baseUrl
    }).catch(()=>{});
}
function validateOption(value, allowed, fallback) {
    return typeof value === "string" && allowed.includes(value) ? value : fallback;
}
function accentThemeColor(accent) {
    return ({
        aqua: "#0a7775",
        mystic: "#2d63b8",
        valor: "#b93845",
        instinct: "#a56a00"
    })[accent] || "#0a7775";
}
function sumIvs(combo) {
    return combo.a + combo.d + combo.s;
}
function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function byId(id) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing required element #${id}`);
    return element;
}
document.addEventListener("DOMContentLoaded", init);
