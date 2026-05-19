import { DATA_LAST_REVIEWED, POKEMON, type Pokemon } from "./data";
import {
  MAX_IV,
  MIN_CP,
  RAID_LEVELS,
  clampInt,
  formatPercent,
  formatRatio,
  maxCpFor,
  purifiedThreshold,
  summarizeCp,
  type BaseStats,
  type CpSummary,
  type IvCombo,
  type WatchlistRow,
} from "./math";

const STORAGE_KEY = "raidIvOdds:v4";

type ThemeChoice = "system" | "light" | "dark";
type AccentChoice = "aqua" | "mystic" | "valor" | "instinct";
type DensityChoice = "comfortable" | "compact";
type LanguageChoice = "en" | "ja";
type WatchFilter = "all" | "partial" | "strong" | "guaranteed";
type ResultTone = "good" | "mixed" | "none";

type Preferences = {
  theme: ThemeChoice;
  accent: AccentChoice;
  density: DensityChoice;
  language: LanguageChoice;
  showDetails: boolean;
  watchFilter: WatchFilter;
};

type SavedState = Partial<
  Preferences & {
    selectedName: string;
    cp: number;
    manualStats: boolean;
    stats: BaseStats;
    raidFloor: number;
    purifyBonus: number;
  }
>;

type ResultState = {
  kind: ResultTone;
  message: string;
};

type RenderOptions = {
  preserveContext?: boolean;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<unknown>;
};

const DEFAULT_PREFS: Preferences = {
  theme: "system",
  accent: "aqua",
  density: "comfortable",
  language: "en",
  showDetails: true,
  watchFilter: "all",
};

const TEXT = {
  en: {
    skipToResults: "Skip to results",
    displayOptions: "Display options",
    eyebrow: "Unofficial raid IV tool",
    appTitle: "Purified Hundo Odds",
    themeLabel: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    languageLabel: "Language",
    accentLabel: "Accent",
    pokemonLabel: "Pokemon",
    pokemonSearchHelp: "Type a boss name in English or Japanese.",
    observedCpLabel: "Observed CP",
    decreaseCp: "Decrease CP",
    increaseCp: "Increase CP",
    manualBaseStats: "Manual base stats",
    resetAll: "Reset all",
    baseAttack: "Base attack",
    baseDefense: "Base defense",
    baseStamina: "Base stamina",
    raidIvFloor: "Raid IV floor",
    floorShadow: "Shadow raid: 6/6/6",
    floorStandard: "Standard raid: 10/10/10",
    floorWild: "Wild/no floor: 0/0/0",
    floorCustom: "Custom",
    purifyBonus: "Purify bonus",
    showIvSpreads: "Show IV spreads",
    watchlistFilter: "Watchlist filter",
    filterAll: "All eligible CPs",
    filterPartial: "Mixed odds only",
    filterStrong: "50% or better",
    filterGuaranteed: "Guaranteed only",
    layoutLabel: "Layout",
    layoutDetailed: "Detailed",
    layoutFast: "Fast scan",
    layoutHelp: "Fast scan keeps the same math and shows more rows at once.",
    installApp: "Install app",
    calculationNotes: "Calculation Notes",
    noteFloor: "Each IV spread from the raid floor through 15/15/15 is counted once.",
    notePurify: "A spread purifies to a hundo when each IV plus the purify bonus reaches 15.",
    noteShadow: "Shadow battle modifiers do not change the catch CP calculation.",
    legalDisclaimer:
      "Unofficial fan-made calculator. Not affiliated with, sponsored by, endorsed by, or approved by Niantic, Scopely, The Pokemon Company, Nintendo, Creatures, or GAME FREAK. Pokemon and related names are trademarks of their respective owners.",
    legalAccuracy:
      "This tool is informational only and depends on current game data and assumptions. Always verify important raid decisions in-game.",
    privacyLink: "Privacy",
    feedbackLink: "Feedback",
    selectedBossHundoCps: "Selected boss hundo CPs",
    nonWeather: "Non-weather",
    weatherBoosted: "Weather boosted",
    useNonWeatherHundo: "Non-weather hundo {cp}",
    useWeatherHundo: "Weather hundo {cp}",
    cpResult: "CP result",
    cpNotPossibleTitle: "CP not possible for this boss",
    cpNotPossibleCopy:
      "No exact level 20 or level 25 IV spread can produce CP {cp} with the selected boss and IV floor.",
    pokemonContext: "Pokemon",
    analyzingCp: "Analyzing CP",
    ivFloor: "IV floor",
    prePurifyTarget: "Pre-purify target",
    baseStats: "Base stats",
    attackShort: "Atk",
    defenseShort: "Def",
    staminaShort: "Sta",
    catchLevelRange: "Catch level {level}; CP range {min}-{max}",
    matchingSpreads: "Matching spreads",
    purifyHundos: "Purify hundos",
    misses: "Misses",
    reducedOdds: "Reduced odds",
    impossibleAtLevel: "CP {cp} is not possible for this Pokemon at level {level} with the current IV floor. ",
    possibleNoGood:
      "CP {cp} is possible, but none of its {total} IV spread{plural} purify to 100%. ",
    guaranteedResult: "Every IV spread that can produce CP {cp} purifies to 100%.",
    mixedResult: "CP {cp} has {total} possible IV spreads; {good} purify to 100%.",
    closestEligible: "Closest eligible CPs:",
    noEligible: "No eligible CPs exist under these settings.",
    matchingIvSpreads: "Matching IV spreads",
    goodMiss: "{good} good / {bad} miss",
    watchlistTitle: "{scenario} Watchlist",
    watchlistHint: "Tap to view CPs that have at least one spread that purifies to 15/15/15.",
    watchOpen: "Open",
    watchClose: "Close",
    watchSummary: "{shown}/{total} CPs, {guaranteed} guaranteed",
    tableCp: "CP",
    tableChance: "Chance",
    tableGoodTotal: "Good/Total",
    tableGoodIvs: "Good IVs",
    analyzeCp: "Analyze CP {cp}, {odds} chance",
    emptyWatchlist: "No CPs match this watchlist filter.",
    validMatchGood: "{scenario} match. {good}/{total} purify to hundo ({odds}).",
    validMatchZero: "{scenario} match. possible CP, but no matching spread purifies to hundo.",
    rareOverlap: "Rare overlap: this CP appears in {scenarios} tables. Check the raid weather state.",
    exactNoSpread: "Within the selected boss range, but no IV spread lands exactly on {cp}.",
    outsideRange: "Outside the selected boss catch ranges. {ranges}.",
    tryNearest: " Try {chips}",
    floorHint: "Counts every spread from {floor}/{floor}/{floor} through 15/15/15.",
    bonusHint: "With +{bonus}, pre-purify {target}/{target}/{target}+ reaches a hundo.",
    dataHint: "Pokemon data last updated: {date}. Seeded list: {count} bosses/forms.",
    languageChanged: "Language changed to English.",
    guaranteedChanceTitle: "Guaranteed purified hundo",
    mixedChanceTitle: "{odds} purified-hundo chance",
    zeroChanceTitle: "Possible CP, 0% purified hundo",
    guaranteedInsight: "{scenario}: all {total} matching IV spreads purify to 15/15/15.",
    mixedInsight: "{scenario}: {good} of {total} matching IV spreads purify to 15/15/15.",
    zeroInsight: "{scenarios} can produce this CP, but 0 matching spreads purify to 15/15/15.",
    spreadSummary: "{total} spreads • {good} purify to 100%",
    comboTitle: "{original} purifies to {purified}",
    hundoMarker: " -> 100%",
    watchTableLabel: "{scenario} eligible CPs",
  },
  ja: {
    skipToResults: "結果へスキップ",
    displayOptions: "表示設定",
    eyebrow: "非公式レイド個体値ツール",
    appTitle: "リトレーン100%個体値の確率",
    themeLabel: "テーマ",
    themeSystem: "端末設定",
    themeLight: "ライト",
    themeDark: "ダーク",
    languageLabel: "言語",
    accentLabel: "カラー",
    pokemonLabel: "レイドボス",
    pokemonSearchHelp: "日本語名・英語名のどちらでも検索できます。",
    observedCpLabel: "確認したCP",
    decreaseCp: "CPを1下げる",
    increaseCp: "CPを1上げる",
    manualBaseStats: "種族値を手入力",
    resetAll: "すべてリセット",
    baseAttack: "攻撃種族値",
    baseDefense: "防御種族値",
    baseStamina: "HP種族値",
    raidIvFloor: "レイド個体値の最低値",
    floorShadow: "シャドウレイド: 6/6/6",
    floorStandard: "通常レイド: 10/10/10",
    floorWild: "野生/最低値なし: 0/0/0",
    floorCustom: "カスタム",
    purifyBonus: "リトレーン加算",
    showIvSpreads: "個体値候補を表示",
    watchlistFilter: "ウォッチリスト絞り込み",
    filterAll: "対象CPすべて",
    filterPartial: "分岐ありのみ",
    filterStrong: "50%以上",
    filterGuaranteed: "確定のみ",
    layoutLabel: "表示",
    layoutDetailed: "詳細",
    layoutFast: "一覧重視",
    layoutHelp: "一覧重視でも計算は同じで、より多くの行を表示します。",
    installApp: "アプリを追加",
    calculationNotes: "計算メモ",
    noteFloor: "個体値の最低値から15/15/15までの全候補を1回ずつ数えます。",
    notePurify: "各個体値にリトレーン加算を足して15になれば100%個体値になります。",
    noteShadow: "シャドウ補正は捕獲時CPの計算には影響しません。",
    legalDisclaimer:
      "非公式のファンメイド計算ツールです。Niantic、Scopely、The Pokemon Company、Nintendo、Creatures、GAME FREAKとは提携・後援・承認関係にありません。Pokemonおよび関連名称は各権利者の商標です。",
    legalAccuracy:
      "このツールは参考情報です。ゲームデータや前提条件に依存するため、重要なレイド判断はゲーム内でも確認してください。",
    privacyLink: "プライバシー",
    feedbackLink: "フィードバック",
    selectedBossHundoCps: "選択中ボスの100%CP",
    nonWeather: "通常時",
    weatherBoosted: "天候ブースト",
    useNonWeatherHundo: "通常時100%CP {cp}",
    useWeatherHundo: "天候ブースト100%CP {cp}",
    cpResult: "CP判定",
    cpNotPossibleTitle: "このボスでは該当しないCP",
    cpNotPossibleCopy: "選択中のボスと個体値最低値では、CP {cp} はレベル20/25の候補に一致しません。",
    pokemonContext: "ポケモン",
    analyzingCp: "判定中CP",
    ivFloor: "個体値最低値",
    prePurifyTarget: "リトレーン前の目安",
    baseStats: "種族値",
    attackShort: "攻撃",
    defenseShort: "防御",
    staminaShort: "HP",
    catchLevelRange: "捕獲レベル {level}; CP範囲 {min}-{max}",
    matchingSpreads: "該当候補",
    purifyHundos: "100%化候補",
    misses: "対象外",
    reducedOdds: "約分後",
    impossibleAtLevel: "現在の個体値最低値では、レベル{level}でCP {cp} は出ません。 ",
    possibleNoGood: "CP {cp} は存在しますが、該当する{total}候補はどれも100%化しません。 ",
    guaranteedResult: "CP {cp} の該当候補はすべてリトレーン後100%になります。",
    mixedResult: "CP {cp} には{total}個の個体値候補があり、そのうち{good}個が100%化します。",
    closestEligible: "近い対象CP:",
    noEligible: "この設定では対象CPがありません。",
    matchingIvSpreads: "該当する個体値候補",
    goodMiss: "対象 {good} / 対象外 {bad}",
    watchlistTitle: "{scenario}ウォッチリスト",
    watchlistHint: "リトレーン後15/15/15になる候補を含むCPを表示します。",
    watchOpen: "開く",
    watchClose: "閉じる",
    watchSummary: "{shown}/{total} CP、確定 {guaranteed}",
    tableCp: "CP",
    tableChance: "確率",
    tableGoodTotal: "対象/合計",
    tableGoodIvs: "対象個体値",
    analyzeCp: "CP {cp} を判定、確率 {odds}",
    emptyWatchlist: "この条件に合うCPはありません。",
    validMatchGood: "{scenario}に一致。{total}候補中{good}候補が100%化します（{odds}）。",
    validMatchZero: "{scenario}に一致。存在するCPですが、100%化する候補はありません。",
    rareOverlap: "まれな重複: このCPは{scenarios}の両方にあります。レイド時の天候を確認してください。",
    exactNoSpread: "選択中ボスのCP範囲内ですが、CP {cp} ぴったりの候補はありません。",
    outsideRange: "選択中ボスの捕獲CP範囲外です。{ranges}。",
    tryNearest: " 近い候補: {chips}",
    floorHint: "{floor}/{floor}/{floor}から15/15/15までの全候補を数えます。",
    bonusHint: "+{bonus}の場合、リトレーン前{target}/{target}/{target}+が100%になります。",
    dataHint: "ポケモンデータ最終更新: {date}。収録ボス/フォーム: {count}件。",
    languageChanged: "表示言語を日本語に切り替えました。",
    guaranteedChanceTitle: "リトレーン後100%確定",
    mixedChanceTitle: "リトレーン後100%の確率 {odds}",
    zeroChanceTitle: "存在するCPですが100%化は0%",
    guaranteedInsight: "{scenario}: 該当する{total}候補すべてがリトレーン後15/15/15になります。",
    mixedInsight: "{scenario}: 該当する{total}候補中{good}候補がリトレーン後15/15/15になります。",
    zeroInsight: "{scenarios}ではこのCPが出ますが、リトレーン後15/15/15になる候補は0件です。",
    spreadSummary: "{total}候補・{good}候補が100%化",
    comboTitle: "{original} はリトレーン後 {purified}",
    hundoMarker: " → 100%",
    watchTableLabel: "{scenario}の対象CP",
  },
} as const;

type TextKey = keyof typeof TEXT.en;

const elements = {
  pokemonInput: byId<HTMLInputElement>("pokemonInput"),
  pokemonOptions: byId<HTMLDataListElement>("pokemonOptions"),
  pokemonSelect: byId<HTMLInputElement>("pokemonSelect"),
  pokemonHelp: byId<HTMLElement>("pokemonHelp"),
  cpInput: byId<HTMLInputElement>("cpInput"),
  cpValidation: byId<HTMLElement>("cpValidation"),
  normalMaxButton: byId<HTMLButtonElement>("normalMaxButton"),
  boostedMaxButton: byId<HTMLButtonElement>("boostedMaxButton"),
  resetButton: byId<HTMLButtonElement>("resetButton"),
  manualStats: byId<HTMLInputElement>("manualStats"),
  atkInput: byId<HTMLInputElement>("atkInput"),
  defInput: byId<HTMLInputElement>("defInput"),
  staInput: byId<HTMLInputElement>("staInput"),
  floorInput: byId<HTMLSelectElement>("floorInput"),
  floorHint: byId<HTMLElement>("floorHint"),
  bonusInput: byId<HTMLInputElement>("bonusInput"),
  bonusHint: byId<HTMLElement>("bonusHint"),
  showDetails: byId<HTMLInputElement>("showDetails"),
  watchFilter: byId<HTMLSelectElement>("watchFilter"),
  densitySelect: byId<HTMLSelectElement>("densitySelect"),
  installButton: byId<HTMLButtonElement>("installButton"),
  hundoHints: byId<HTMLElement>("hundoHints"),
  primaryInsight: byId<HTMLElement>("primaryInsight"),
  contextStrip: byId<HTMLElement>("contextStrip"),
  resultsGrid: byId<HTMLElement>("resultsGrid"),
  watchlistGrid: byId<HTMLElement>("watchlistGrid"),
  dataHint: byId<HTMLElement>("dataHint"),
  languageStatus: byId<HTMLElement>("languageStatus"),
  themeButtons: Array.from(document.querySelectorAll<HTMLButtonElement>("[data-theme-choice]")),
  languageButtons: Array.from(document.querySelectorAll<HTMLButtonElement>("[data-language-choice]")),
  accentButtons: Array.from(document.querySelectorAll<HTMLButtonElement>("[data-accent-choice]")),
  cpStepButtons: Array.from(document.querySelectorAll<HTMLButtonElement>("[data-cp-step]")),
  themeMeta: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'),
};

let prefs: Preferences = { ...DEFAULT_PREFS };
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let watchlistSignature = "";

function init(): void {
  renderPokemonOptions();
  restoreState();
  applyAppearance();
  bindEvents();
  registerServiceWorker();
  render();
}

function renderPokemonOptions(): void {
  const selectedValue = elements.pokemonSelect.value || "Mewtwo";
  elements.pokemonOptions.innerHTML = sortedPokemon().map(
    (pokemon) =>
      `<option value="${escapeHtml(pokemonInputValue(pokemon))}" label="${escapeHtml(pokemon.name)}"></option>`,
  ).join("");
  elements.pokemonSelect.value = POKEMON.some((pokemon) => pokemon.name === selectedValue) ? selectedValue : "Mewtwo";
  syncPokemonInputToSelected();
}

function restoreState(): void {
  const saved = { ...loadSavedState(), ...loadStateFromUrl() };
  const savedPokemon =
    typeof saved.selectedName === "string" && POKEMON.some((pokemon) => pokemon.name === saved.selectedName)
      ? saved.selectedName
      : "Mewtwo";

  prefs = {
    ...DEFAULT_PREFS,
    theme: validateOption(saved.theme, ["system", "light", "dark"], DEFAULT_PREFS.theme),
    accent: validateOption(saved.accent, ["aqua", "mystic", "valor", "instinct"], DEFAULT_PREFS.accent),
    density: validateOption(saved.density, ["comfortable", "compact"], DEFAULT_PREFS.density),
    language: validateOption(saved.language, ["en", "ja"], DEFAULT_PREFS.language),
    showDetails: typeof saved.showDetails === "boolean" ? saved.showDetails : DEFAULT_PREFS.showDetails,
    watchFilter: validateOption(
      saved.watchFilter,
      ["all", "partial", "strong", "guaranteed"],
      DEFAULT_PREFS.watchFilter,
    ),
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
  elements.cpInput.value =
    Number.isFinite(Number(saved.cp)) && Number(saved.cp) >= MIN_CP
      ? String(clampInt(saved.cp, MIN_CP, 99999, MIN_CP))
      : String(maxCpFor(readBaseStats(), RAID_LEVELS[0]));
  elements.showDetails.checked = prefs.showDetails;
  elements.watchFilter.value = prefs.watchFilter;
  elements.densitySelect.value = prefs.density;
}

function bindEvents(): void {
  elements.pokemonInput.addEventListener("input", () => {
    commitPokemonInput(false);
  });

  elements.pokemonInput.addEventListener("change", () => {
    commitPokemonInput(true);
  });

  elements.pokemonInput.addEventListener("blur", () => {
    commitPokemonInput(true);
  });

  elements.manualStats.addEventListener("change", () => {
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
    elements.bonusInput,
  ].forEach((input) => input.addEventListener("input", () => render()));

  elements.showDetails.addEventListener("change", () => {
    prefs.showDetails = elements.showDetails.checked;
    render();
  });

  elements.watchFilter.addEventListener("change", () => {
    prefs.watchFilter = elements.watchFilter.value as WatchFilter;
    render();
  });

  elements.densitySelect.addEventListener("change", () => {
    prefs.density = elements.densitySelect.value as DensityChoice;
    applyAppearance();
    render();
  });

  elements.normalMaxButton.addEventListener("click", () => {
    elements.cpInput.value = String(maxCpFor(readBaseStats(), RAID_LEVELS[0]));
    render();
  });

  elements.boostedMaxButton.addEventListener("click", () => {
    elements.cpInput.value = String(maxCpFor(readBaseStats(), RAID_LEVELS[1]));
    render();
  });

  elements.resetButton.addEventListener("click", resetAll);

  elements.cpStepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const delta = Number(button.dataset.cpStep);
      const nextCp = clampInt(elements.cpInput.value, MIN_CP, 99999, MIN_CP) + delta;
      elements.cpInput.value = String(clampInt(nextCp, MIN_CP, 99999, MIN_CP));
      render();
    });
  });

  elements.themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      prefs.theme = button.dataset.themeChoice as ThemeChoice;
      applyAppearance();
      render();
    });
  });

  elements.languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextLanguage = button.dataset.languageChoice as LanguageChoice;
      if (nextLanguage === prefs.language) return;
      prefs.language = nextLanguage;
      announceLanguageChange();
      render();
    });
  });

  elements.accentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      prefs.accent = button.dataset.accentChoice as AccentChoice;
      applyAppearance();
      render();
    });
  });

  const handleCpButtonClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>("[data-cp]");
    if (!button) return;
    elements.cpInput.value = button.dataset.cp ?? String(MIN_CP);
    render();
    elements.resultsGrid.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  elements.resultsGrid.addEventListener("click", handleCpButtonClick);
  elements.watchlistGrid.addEventListener("click", handleCpButtonClick);
  elements.contextStrip.addEventListener("input", handleSummaryEdit);
  elements.contextStrip.addEventListener("change", handleSummaryEdit);
  elements.contextStrip.addEventListener("keydown", handleSummaryKeydown);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    elements.installButton.hidden = false;
  });

  elements.installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    elements.installButton.hidden = true;
  });

  const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemThemeChange = (): void => {
    if (prefs.theme === "system") applyAppearance();
  };

  systemThemeQuery.addEventListener("change", handleSystemThemeChange);
}

function selectedPokemon(): Pokemon {
  return POKEMON.find((pokemon) => pokemon.name === elements.pokemonSelect.value) || POKEMON[0];
}

function commitPokemonInput(forceMatch: boolean): void {
  const match = resolvePokemonInput(elements.pokemonInput.value, forceMatch ? "exact" : "unique-prefix");

  if (!match) {
    if (forceMatch) syncPokemonInputToSelected();
    return;
  }

  if (match.name === elements.pokemonSelect.value) {
    if (forceMatch) syncPokemonInputToSelected();
    return;
  }

  elements.pokemonSelect.value = match.name;
  syncStatsToSelected();
  render();
}

function handleSummaryEdit(event: Event): void {
  if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)) return;
  const control = event.target.dataset.summaryControl;

  if (control === "pokemon") {
    elements.pokemonSelect.value = event.target.value;
    syncStatsToSelected();
    render();
    return;
  }

  if (control === "cp") elements.cpInput.value = event.target.value;
  if (control === "floor") elements.floorInput.value = event.target.value;
  if (control === "bonus") elements.bonusInput.value = event.target.value;
  if (control === "manual" && event.target instanceof HTMLInputElement) {
    elements.manualStats.checked = event.target.checked;
    if (!elements.manualStats.checked) syncStatsToSelected();
    syncManualState();
  }
  if (control === "atk") elements.atkInput.value = event.target.value;
  if (control === "def") elements.defInput.value = event.target.value;
  if (control === "sta") elements.staInput.value = event.target.value;

  if (control === "manual") {
    render();
    return;
  }

  updateSummaryTargetHint();
  render({ preserveContext: true });
}

function handleSummaryKeydown(event: KeyboardEvent): void {
  if (event.key !== "Enter") return;
  if (!(event.target instanceof HTMLInputElement)) return;
  if (!event.target.dataset.summaryControl) return;
  event.preventDefault();
  render({ preserveContext: true });
  elements.contextStrip.querySelector<HTMLInputElement>(`[data-summary-control="${event.target.dataset.summaryControl}"]`)?.focus();
}

function syncPokemonInputToSelected(): void {
  elements.pokemonInput.value = pokemonInputValue(selectedPokemon());
}

function resetAll(): void {
  prefs = { ...DEFAULT_PREFS };
  elements.pokemonSelect.value = "Mewtwo";
  elements.manualStats.checked = false;
  elements.floorInput.value = "6";
  elements.bonusInput.value = "2";
  elements.showDetails.checked = DEFAULT_PREFS.showDetails;
  elements.watchFilter.value = DEFAULT_PREFS.watchFilter;
  elements.densitySelect.value = DEFAULT_PREFS.density;
  syncStatsToSelected();
  elements.cpInput.value = String(maxCpFor(readBaseStats(), RAID_LEVELS[0]));
  applyAppearance();
  render();
}

function syncStatsToSelected(): void {
  const pokemon = selectedPokemon();
  elements.atkInput.value = String(pokemon.atk);
  elements.defInput.value = String(pokemon.def);
  elements.staInput.value = String(pokemon.sta);
  syncManualState();
}

function syncManualState(): void {
  const disabled = !elements.manualStats.checked;
  elements.atkInput.disabled = disabled;
  elements.defInput.disabled = disabled;
  elements.staInput.disabled = disabled;
}

function readBaseStats(): BaseStats {
  const selected = selectedPokemon();
  return {
    atk: clampInt(elements.atkInput.value, 1, 999, selected.atk),
    def: clampInt(elements.defInput.value, 1, 999, selected.def),
    sta: clampInt(elements.staInput.value, 1, 999, selected.sta),
  };
}

function readSettings(): {
  baseStats: BaseStats;
  cp: number;
  raidFloor: number;
  purifyBonus: number;
} {
  return {
    baseStats: readBaseStats(),
    cp: clampInt(elements.cpInput.value, MIN_CP, 99999, MIN_CP),
    raidFloor: clampInt(elements.floorInput.value, 0, MAX_IV, 6),
    purifyBonus: clampInt(elements.bonusInput.value, 0, MAX_IV, 2),
  };
}

function render(options: RenderOptions = {}): void {
  const settings = readSettings();
  const summaries = RAID_LEVELS.map((raidLevel) =>
    summarizeCp(settings.baseStats, raidLevel, settings.cp, settings.raidFloor, settings.purifyBonus),
  );

  renderStaticText();
  renderQuickButtons(settings.baseStats);
  renderHundoHints(settings.baseStats);
  renderCpValidation(summaries, settings);
  renderPrimaryInsight(summaries, settings, !options.preserveContext);
  renderAssumptionHints(settings);
  renderDataHint();
  elements.resultsGrid.innerHTML = summaries.map(renderResultPanel).join("");
  const nextWatchlistSignature = watchlistRenderSignature(settings);
  if (nextWatchlistSignature !== watchlistSignature) {
    elements.watchlistGrid.innerHTML = summaries.map(renderWatchlistPanel).join("");
    watchlistSignature = nextWatchlistSignature;
  }
  updateControlState();
  saveState(settings);
  syncUrl(settings);
}

function watchlistRenderSignature(settings: {
  baseStats: BaseStats;
  raidFloor: number;
  purifyBonus: number;
}): string {
  return [
    prefs.language,
    prefs.watchFilter,
    settings.raidFloor,
    settings.purifyBonus,
    settings.baseStats.atk,
    settings.baseStats.def,
    settings.baseStats.sta,
  ].join("|");
}

function renderStaticText(): void {
  document.documentElement.lang = prefs.language === "ja" ? "ja" : "en";
  document.title = prefs.language === "ja" ? "シャドウレイド リトレーン100%個体値の確率" : "Shadow Raid Purified Hundo Odds";
  renderPokemonOptions();

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n as TextKey | undefined;
    if (!key) return;
    element.textContent = copy(key);
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel as TextKey | undefined;
    if (!key) return;
    element.setAttribute("aria-label", copy(key));
  });

  document.querySelectorAll<HTMLOptionElement>("[data-floor-custom]").forEach((option) => {
    option.textContent = `${copy("floorCustom")}: ${option.value}/${option.value}/${option.value}`;
  });
}

function renderQuickButtons(baseStats: BaseStats): void {
  elements.normalMaxButton.textContent = formatCopy("useNonWeatherHundo", {
    cp: maxCpFor(baseStats, RAID_LEVELS[0]),
  });
  elements.boostedMaxButton.textContent = formatCopy("useWeatherHundo", {
    cp: maxCpFor(baseStats, RAID_LEVELS[1]),
  });
}

function renderHundoHints(baseStats: BaseStats): void {
  elements.hundoHints.innerHTML = `
    <span class="hundo-hint-label">${copy("selectedBossHundoCps")}</span>
    <span class="hundo-hint-values"><span>${copy("nonWeather")}</span> <strong>${maxCpFor(
      baseStats,
      RAID_LEVELS[0],
    )}</strong></span>
    <span class="hundo-hint-values"><span>${copy("weatherBoosted")}</span> <strong>${maxCpFor(
      baseStats,
      RAID_LEVELS[1],
    )}</strong></span>
  `;
}

function renderCpValidation(
  summaries: CpSummary[],
  settings: { baseStats: BaseStats; cp: number; raidFloor: number; purifyBonus: number },
): void {
  const possible = summaries.filter((summary) => summary.total > 0);
  const inRange = summaries.filter((summary) => settings.cp >= summary.minCp && settings.cp <= summary.maxCp);
  const ranges = summaries.map((summary) => `${scenarioLabel(summary)}: ${summary.minCp}-${summary.maxCp}`).join(" · ");
  const possibleClass = possible.length ? "is-valid" : "is-invalid";

  elements.cpInput.min = String(Math.min(...summaries.map((summary) => summary.minCp)));
  elements.cpInput.max = String(Math.max(...summaries.map((summary) => summary.maxCp)));
  elements.cpInput.setAttribute("aria-invalid", String(!possible.length));

  if (possible.length === 1) {
    const match = possible[0];
    elements.cpInput.setCustomValidity("");
    elements.cpValidation.className = `field-help cp-validation ${possibleClass}`;
    elements.cpValidation.textContent = match.good
      ? formatCopy("validMatchGood", {
          scenario: scenarioLabel(match),
          good: match.good,
          total: match.total,
          odds: formatPercent(match.odds),
        })
      : formatCopy("validMatchZero", { scenario: scenarioLabel(match) });
    return;
  }

  if (possible.length > 1) {
    elements.cpInput.setCustomValidity("");
    elements.cpValidation.className = `field-help cp-validation ${possibleClass}`;
    elements.cpValidation.textContent = formatCopy("rareOverlap", {
      scenarios: possible.map(scenarioLabel).join(prefs.language === "ja" ? "と" : " and "),
    });
    return;
  }

  const nearest = summaries.flatMap((summary) => nearestPossibleCpButtons(summary, settings.cp)).slice(0, 3).join(" ");
  const message = inRange.length
    ? formatCopy("exactNoSpread", { cp: settings.cp })
    : formatCopy("outsideRange", { ranges });

  elements.cpInput.setCustomValidity(message);
  elements.cpValidation.className = `field-help cp-validation ${possibleClass}`;
  elements.cpValidation.innerHTML = `${escapeHtml(message)}${
    nearest ? formatCopy("tryNearest", { chips: nearest }) : ""
  }`;
}

function nearestPossibleCpButtons(summary: CpSummary, cp: number): string[] {
  return Array.from(summary.buckets.keys())
    .sort((left, right) => Math.abs(left - cp) - Math.abs(right - cp) || right - left)
    .slice(0, 2)
    .map(
      (candidate) =>
        `<button class="inline-cp-button" type="button" data-cp="${candidate}">${candidate}</button>`,
    );
}

function renderDataHint(): void {
  elements.dataHint.textContent = formatCopy("dataHint", {
    count: POKEMON.length,
    date: formatReviewedDate(DATA_LAST_REVIEWED),
  });
}

function renderAssumptionHints(settings: { raidFloor: number; purifyBonus: number }): void {
  const threshold = purifiedThreshold(settings.purifyBonus);
  elements.floorHint.textContent = formatCopy("floorHint", { floor: settings.raidFloor });
  elements.bonusHint.textContent = formatCopy("bonusHint", { bonus: settings.purifyBonus, target: threshold });
}

function renderPrimaryInsight(
  summaries: CpSummary[],
  settings: { baseStats: BaseStats; cp: number; raidFloor: number; purifyBonus: number },
  renderContext = true,
): void {
  const eligible = summaries.filter((summary) => summary.total && summary.good);
  const possible = summaries.filter((summary) => summary.total);
  const best = eligible.slice().sort((left, right) => right.odds - left.odds)[0];
  let state: ResultTone = "none";
  let title = copy("cpNotPossibleTitle");
  let body = formatCopy("cpNotPossibleCopy", { cp: settings.cp });

  if (best) {
    state = best.odds === 1 ? "good" : "mixed";
    title =
      best.odds === 1
        ? copy("guaranteedChanceTitle")
        : formatCopy("mixedChanceTitle", { odds: formatPercent(best.odds) });
    body = formatCopy(best.odds === 1 ? "guaranteedInsight" : "mixedInsight", {
      scenario: scenarioLabel(best),
      good: best.good,
      total: best.total,
    });
  } else if (possible.length) {
    title = copy("zeroChanceTitle");
    body = formatCopy("zeroInsight", {
      scenarios: possible.map(scenarioLabel).join(prefs.language === "ja" ? "と" : " and "),
    });
  }

  elements.primaryInsight.className = `primary-insight ${state}`;
  elements.primaryInsight.innerHTML = `
    <span class="insight-label">${copy("cpResult")}</span>
    <span class="insight-title">${title}</span>
    <p class="insight-copy">${body}</p>
  `;

  if (!renderContext) return;

  const threshold = purifiedThreshold(settings.purifyBonus);
  const pokemon = selectedPokemon();
  elements.contextStrip.innerHTML = `
    <div class="context-card context-edit">
      <label class="context-label" for="summaryPokemonControl">${copy("pokemonContext")}</label>
      <select id="summaryPokemonControl" class="summary-value" data-summary-control="pokemon">${renderPokemonSelectOptions(pokemon.name)}</select>
    </div>
    <div class="context-card context-edit">
      <label class="context-label" for="summaryCpControl">${copy("analyzingCp")}</label>
      <input id="summaryCpControl" class="summary-value" data-summary-control="cp" inputmode="numeric" min="${MIN_CP}" type="number" value="${settings.cp}" />
    </div>
    <div class="context-card context-edit">
      <label class="context-label" for="summaryFloorControl">${copy("ivFloor")}</label>
      <select id="summaryFloorControl" class="summary-value" data-summary-control="floor">${renderIvFloorOptions(settings.raidFloor)}</select>
    </div>
    <div class="context-card context-edit">
      <label class="context-label" for="summaryBonusControl">${copy("purifyBonus")}</label>
      <input id="summaryBonusControl" class="summary-value" data-summary-control="bonus" inputmode="numeric" max="${MAX_IV}" min="0" type="number" value="${settings.purifyBonus}" />
      <em data-summary-target>${copy("prePurifyTarget")}: ${threshold}/${threshold}/${threshold}+</em>
    </div>
    <div class="context-card context-edit">
      <span class="context-label">${copy("baseStats")}</span>
      <label class="mini-toggle" for="summaryManualControl">
        <input id="summaryManualControl" data-summary-control="manual" type="checkbox" ${elements.manualStats.checked ? "checked" : ""} />
        ${copy("manualBaseStats")}
      </label>
      ${renderSummaryStats(settings.baseStats)}
    </div>
  `;
}

function renderResultPanel(summary: CpSummary): string {
  const state = resultState(summary);
  const badgeClass = summary.good === summary.total && summary.total ? "is-full" : summary.good ? "" : "is-zero";
  const nearest = renderNearest(summary);

  return `
    <article class="result-panel is-${state.kind}" data-testid="${summary.raidLevel.key}-result">
      <div class="result-head">
        <div>
          <h2>${scenarioLabel(summary)}</h2>
          <p class="scenario-copy">${formatCopy("catchLevelRange", {
            level: summary.raidLevel.level,
            min: summary.minCp,
            max: summary.maxCp,
          })}</p>
          <p class="spread-summary">${formatCopy("spreadSummary", {
            total: summary.total,
            good: summary.good,
          })}</p>
        </div>
        <div class="odds-badge ${badgeClass}">
          <span class="odds-value">${formatPercent(summary.odds)}</span>
          <span class="odds-ratio">${summary.total ? `${summary.good}/${summary.total}` : "0/0"}</span>
        </div>
      </div>

      <div class="odds-meter" aria-hidden="true"><span style="width: ${Math.max(0, summary.odds * 100)}%"></span></div>
      <p class="status-line ${state.kind}">${state.message}${nearest}</p>

      <div class="stat-row" aria-label="${formatCopy("watchTableLabel", { scenario: scenarioLabel(summary) })}">
        <div class="stat-item">
          <span>${copy("matchingSpreads")}</span>
          <strong>${summary.total}</strong>
        </div>
        <div class="stat-item">
          <span>${copy("purifyHundos")}</span>
          <strong>${summary.good}</strong>
        </div>
        <div class="stat-item">
          <span>${copy("misses")}</span>
          <strong>${summary.bad}</strong>
        </div>
        <div class="stat-item">
          <span>${copy("reducedOdds")}</span>
          <strong>${formatRatio(summary.good, summary.total)}</strong>
        </div>
      </div>

      ${renderCombos(summary)}
    </article>
  `;
}

function renderPokemonSelectOptions(selectedName: string): string {
  return sortedPokemon()
    .map(
      (pokemon) =>
        `<option value="${escapeHtml(pokemon.name)}" ${pokemon.name === selectedName ? "selected" : ""}>${escapeHtml(
          pokemonInputValue(pokemon),
        )}</option>`,
    )
    .join("");
}

function renderIvFloorOptions(selectedFloor: number): string {
  return Array.from({ length: MAX_IV + 1 }, (_value, floor) => {
    const label =
      floor === 6
        ? copy("floorShadow")
        : floor === 10
          ? copy("floorStandard")
          : `${copy("floorCustom")}: ${floor}/${floor}/${floor}`;
    return `<option value="${floor}" ${floor === selectedFloor ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function renderSummaryStats(baseStats: BaseStats): string {
  const disabled = elements.manualStats.checked ? "" : "disabled";
  return `
    <div class="mini-stat-grid">
      <label>
        <span>${copy("attackShort")}</span>
        <input data-summary-control="atk" inputmode="numeric" min="1" type="number" value="${baseStats.atk}" ${disabled} aria-label="${copy("baseAttack")}" />
      </label>
      <label>
        <span>${copy("defenseShort")}</span>
        <input data-summary-control="def" inputmode="numeric" min="1" type="number" value="${baseStats.def}" ${disabled} aria-label="${copy("baseDefense")}" />
      </label>
      <label>
        <span>${copy("staminaShort")}</span>
        <input data-summary-control="sta" inputmode="numeric" min="1" type="number" value="${baseStats.sta}" ${disabled} aria-label="${copy("baseStamina")}" />
      </label>
    </div>
  `;
}

function updateSummaryTargetHint(): void {
  const target = elements.contextStrip.querySelector<HTMLElement>("[data-summary-target]");
  if (!target) return;
  const threshold = purifiedThreshold(clampInt(elements.bonusInput.value, 0, MAX_IV, 2));
  target.textContent = `${copy("prePurifyTarget")}: ${threshold}/${threshold}/${threshold}+`;
}

function resultState(summary: CpSummary): ResultState {
  if (!summary.total) {
    return {
      kind: "none",
      message: formatCopy("impossibleAtLevel", { cp: summary.cp, level: summary.raidLevel.level }),
    };
  }

  if (!summary.good) {
    return {
      kind: "none",
      message: formatCopy("possibleNoGood", {
        cp: summary.cp,
        total: summary.total,
        plural: summary.total === 1 ? "" : "s",
      }),
    };
  }

  if (summary.good === summary.total) {
    return {
      kind: "good",
      message: formatCopy("guaranteedResult", { cp: summary.cp }),
    };
  }

  return {
    kind: "mixed",
    message: formatCopy("mixedResult", { cp: summary.cp, total: summary.total, good: summary.good }),
  };
}

function renderNearest(summary: CpSummary): string {
  if (summary.total && summary.good) return "";
  if (!summary.nearestEligible.length) return copy("noEligible");

  const chips = summary.nearestEligible
    .map(
      (row) =>
        `<button class="chip-button" type="button" data-cp="${row.cp}">${row.cp} (${formatPercent(row.odds)})</button>`,
    )
    .join("");

  return `<span class="nearest-list">${copy("closestEligible")} ${chips}</span>`;
}

function renderCombos(summary: CpSummary): string {
  if (!summary.total) return "";

  const combos = summary.combos
    .slice()
    .sort((left, right) => Number(right.good) - Number(left.good) || sumIvs(right) - sumIvs(left))
    .map(renderComboPill)
    .join("");

  return `
    <div class="combo-area" ${prefs.showDetails ? "" : "hidden"}>
      <div class="combo-head">
        <span>${copy("matchingIvSpreads")}</span>
        <span>${formatCopy("goodMiss", { good: summary.good, bad: summary.bad })}</span>
      </div>
      <div class="combo-list">${combos}</div>
    </div>
  `;
}

function renderComboPill(combo: IvCombo): string {
  const original = `${combo.a}/${combo.d}/${combo.s}`;
  const purified = `${combo.purified.a}/${combo.purified.d}/${combo.purified.s}`;
  const title = formatCopy("comboTitle", { original, purified });
  return `
    <span class="combo-pill ${combo.good ? "good" : "bad"}" title="${escapeHtml(title)}">
      ${original}${combo.good ? copy("hundoMarker") : ""}
    </span>
  `;
}

function renderWatchlistPanel(summary: CpSummary): string {
  const filteredRows = filterWatchlist(summary.watchlist);
  const guaranteed = filteredRows.filter((row) => row.good === row.total).length;
  const rows = filteredRows.map(renderWatchlistRow).join("");

  return `
    <details class="watch-panel" data-testid="${summary.raidLevel.key}-watchlist">
      <summary class="watch-head" data-watch-open="${escapeHtml(copy("watchOpen"))}" data-watch-close="${escapeHtml(
        copy("watchClose"),
      )}">
        <div>
          <h2>${formatCopy("watchlistTitle", { scenario: scenarioLabel(summary) })}</h2>
          <p>${copy("watchlistHint")}</p>
        </div>
        <span class="watch-summary">${formatCopy("watchSummary", {
          shown: filteredRows.length,
          total: summary.watchlist.length,
          guaranteed,
        })}</span>
      </summary>
      ${
        rows
          ? `<div class="watch-table" role="table" aria-label="${escapeHtml(
              formatCopy("watchTableLabel", { scenario: scenarioLabel(summary) }),
            )}">
              <div class="watch-table-head" role="row">
                <span>${copy("tableCp")}</span>
                <span>${copy("tableChance")}</span>
                <span>${copy("tableGoodTotal")}</span>
                <span>${copy("tableGoodIvs")}</span>
              </div>
              <div class="watch-table-body">${rows}</div>
            </div>`
          : `<p class="empty-state">${copy("emptyWatchlist")}</p>`
      }
    </details>
  `;
}

function renderWatchlistRow(row: WatchlistRow): string {
  const oddsClass = row.good === row.total ? "full" : "partial";
  const comboPreview = previewGoodCombos(row.goodCombos);

  return `
    <button class="watch-row" type="button" data-cp="${row.cp}" role="row" aria-label="${formatCopy("analyzeCp", {
      cp: row.cp,
      odds: formatPercent(row.odds),
    })}">
      <span class="watch-row-cp">${row.cp}</span>
      <span class="odds-token ${oddsClass}">${formatPercent(row.odds)}</span>
      <span class="watch-row-ratio" data-label="${copy("tableGoodTotal")}">${row.good}/${row.total}</span>
      <span class="watch-row-combos">${escapeHtml(comboPreview)}</span>
    </button>
  `;
}

function filterWatchlist(rows: readonly WatchlistRow[]): WatchlistRow[] {
  if (prefs.watchFilter === "partial") return rows.filter((row) => row.good > 0 && row.good < row.total);
  if (prefs.watchFilter === "strong") return rows.filter((row) => row.odds >= 0.5);
  if (prefs.watchFilter === "guaranteed") return rows.filter((row) => row.good === row.total);
  return [...rows];
}

function previewGoodCombos(combos: readonly IvCombo[]): string {
  const sorted = combos.slice().sort((left, right) => sumIvs(left) - sumIvs(right));
  const visible = sorted
    .slice(0, 3)
    .map((combo) => `${combo.a}/${combo.d}/${combo.s}`)
    .join(", ");
  const hidden = sorted.length - 3;
  return hidden > 0 ? `${visible}, +${hidden}` : visible;
}

function applyAppearance(): void {
  const resolvedTheme =
    prefs.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : prefs.theme === "system"
        ? "light"
        : prefs.theme;

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.mode = prefs.theme;
  document.documentElement.dataset.accent = prefs.accent;
  document.documentElement.dataset.density = prefs.density;
  document.documentElement.dataset.language = prefs.language;

  const themeColor = resolvedTheme === "dark" ? "#101417" : accentThemeColor(prefs.accent);
  elements.themeMeta?.setAttribute("content", themeColor);
  updateControlState();
}

function updateControlState(): void {
  elements.themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === prefs.theme));
  });
  elements.languageButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.languageChoice === prefs.language));
  });
  elements.accentButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.accentChoice === prefs.accent));
  });
  elements.showDetails.checked = prefs.showDetails;
  elements.watchFilter.value = prefs.watchFilter;
  elements.densitySelect.value = prefs.density;
}

function saveState(settings: { baseStats: BaseStats; cp: number; raidFloor: number; purifyBonus: number }): void {
  const state: SavedState = {
    selectedName: elements.pokemonSelect.value,
    cp: settings.cp,
    manualStats: elements.manualStats.checked,
    stats: settings.baseStats,
    raidFloor: settings.raidFloor,
    purifyBonus: settings.purifyBonus,
    theme: prefs.theme,
    accent: prefs.accent,
    density: prefs.density,
    language: prefs.language,
    showDetails: prefs.showDetails,
    watchFilter: prefs.watchFilter,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is a convenience; the calculator still works without it.
  }
}

function loadSavedState(): SavedState {
  try {
    return (JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {}) as SavedState;
  } catch {
    return {};
  }
}

function loadStateFromUrl(): SavedState {
  const state: SavedState = {};
  const query = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#?") ? new URLSearchParams(window.location.hash.slice(2)) : null;
  const params = hash && Array.from(hash.keys()).length ? hash : query;

  const pokemon = params.get("pokemon") || params.get("boss");
  const cp = params.get("cp");
  const floor = params.get("floor");
  const bonus = params.get("bonus");

  if (pokemon && POKEMON.some((entry) => pokemonNameMatches(entry, pokemon))) {
    state.selectedName =
      POKEMON.find((entry) => pokemonNameMatches(entry, pokemon))?.name || pokemon;
  }

  if (cp) state.cp = clampInt(cp, MIN_CP, 99999, MIN_CP);
  if (floor) state.raidFloor = clampInt(floor, 0, MAX_IV, 6);
  if (bonus) state.purifyBonus = clampInt(bonus, 0, MAX_IV, 2);

  return state;
}

function syncUrl(settings: { cp: number; raidFloor: number; purifyBonus: number }): void {
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

function registerServiceWorker(): void {
  const isProductionBuild = typeof import.meta.env === "object" && Boolean(import.meta.env.PROD);
  if (!isProductionBuild || !("serviceWorker" in navigator)) return;
  const baseUrl = typeof import.meta.env === "object" ? import.meta.env.BASE_URL : "/";
  navigator.serviceWorker.register(`${baseUrl}sw.js`, { scope: baseUrl }).catch(() => {});
}

function copy(key: TextKey): string {
  return TEXT[prefs.language][key] || TEXT.en[key];
}

function formatCopy(key: TextKey, values: Record<string, string | number>): string {
  return copy(key).replaceAll(/\{(\w+)\}/g, (_match, token: string) => String(values[token] ?? ""));
}

function scenarioLabel(summary: Pick<CpSummary, "raidLevel">): string {
  return summary.raidLevel.key === "normal" ? copy("nonWeather") : copy("weatherBoosted");
}

function sortedPokemon(): Pokemon[] {
  const locale = prefs.language === "ja" ? "ja" : "en";
  return POKEMON.slice().sort((left, right) =>
    pokemonDisplayName(left).localeCompare(pokemonDisplayName(right), locale),
  );
}

function pokemonDisplayName(pokemon: Pokemon): string {
  return prefs.language === "ja" ? pokemon.nameJa : pokemon.name;
}

function pokemonInputValue(pokemon: Pokemon): string {
  // Keep English visible in Japanese mode so native datalist search still accepts English boss names.
  return prefs.language === "ja" ? `${pokemon.nameJa} (${pokemon.name})` : pokemon.name;
}

function pokemonNameMatches(pokemon: Pokemon, value: string): boolean {
  return pokemonSearchTokens(pokemon).some((token) => normalizeSearch(token) === normalizeSearch(value));
}

function resolvePokemonInput(value: string, mode: "exact" | "unique-prefix"): Pokemon | null {
  const exact = POKEMON.find((pokemon) => pokemonNameMatches(pokemon, value));
  if (exact || mode === "exact") return exact ?? null;

  const normalized = normalizeSearch(value);
  if (!normalized) return null;

  const matches = POKEMON.filter((pokemon) =>
    pokemonSearchTokens(pokemon).some((token) => normalizeSearch(token).startsWith(normalized)),
  );

  return matches.length === 1 ? matches[0] : null;
}

function pokemonSearchTokens(pokemon: Pokemon): string[] {
  return [pokemon.name, pokemon.nameJa, pokemonInputValue(pokemon)];
}

function normalizeSearch(value: string): string {
  return value.trim().normalize("NFKC").toLowerCase();
}

function formatReviewedDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(prefs.language === "ja" ? "ja-JP" : "en-US", {
    dateStyle: "long",
  }).format(date);
}

function announceLanguageChange(): void {
  elements.languageStatus.textContent = copy("languageChanged");
}

function validateOption<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function accentThemeColor(accent: AccentChoice): string {
  return (
    {
      aqua: "#0a7775",
      mystic: "#2d63b8",
      valor: "#b93845",
      instinct: "#a56a00",
    }[accent] || "#0a7775"
  );
}

function sumIvs(combo: Pick<IvCombo, "a" | "d" | "s">): number {
  return combo.a + combo.d + combo.s;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

document.addEventListener("DOMContentLoaded", init);
