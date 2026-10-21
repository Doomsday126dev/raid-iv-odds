import japanese from "./japanese-names.json";
export type Language = "en" | "ja";
export function initialLanguage(params: URLSearchParams): Language {
  const link = params.get("lang") ?? params.get("language");
  if (link === "ja" || link === "en") return link;
  try {
    const saved = localStorage.getItem("hundo-check-language");
    if (saved === "ja" || saved === "en") return saved;
    const old = JSON.parse(
      localStorage.getItem("raidIvOdds:v4") ?? "{}",
    ).language;
    if (old === "ja" || old === "en") return old;
  } catch {
    /* Optional preferences. */
  }
  return navigator.language.startsWith("ja") ? "ja" : "en";
}
export const language = initialLanguage(new URLSearchParams(location.search));
document.documentElement.lang = language;
const en = {
  shadowScope: "Shadow catch CP only. CP cannot prove encounter availability.",
  unsupportedContextTitle: "Encounter type not supported",
  unsupportedContextCopy:
    "This CP fits a Rocket catch level, but standard Grunt/Leader IV assumptions are not supported for this Pokémon class. Giovanni, research and event-specific catches need separate conditions.",
  referenceRocket: "Rocket encounters",
  referenceRaids: "Raids",
  referenceMode: "Reference group",
  markerLegend: "Red outline: multiple IV combinations. Tap for details.",
  markerScope:
    "Raid markers use Shadow raid rules where supported; normal raid comparison is in details.",
  shadowRaidRef: "Shadow raid reference",
  normalRaidRef: "Normal raid reference",
  collisionHint:
    "CP {cp} matches {count} IV spreads here; CP alone does not prove perfect IVs.",
  referenceUnique:
    "This CP has one matching IV spread at the assumed catch level and IV floor. CP alone does not prove the encounter or level.",
  referenceMatches:
    "{count} matching IV spreads at the assumed level and floor. Exactly one is 15/15/15.",
  normalComparison:
    "Normal raid comparison: {count} matching spreads (minimum IVs 10/10/10).",
  refUnsupported:
    "Level-specific CP reference only. The standard Rocket model is not supported for this species/form; no collision or IV-odds claim is made.",
  useCp: "Use this CP in the checker",
  close: "Close",
  matchingIvs: "Matching IV spreads",
  ivAttack: "Attack",
  ivDefense: "Defense",
  ivHp: "HP",
  combinationOne: "1 matching IV combination",
  combinationCount: "{count} matching IV combinations",
  calculationAssumptions: "Calculation assumptions",
  referenceDetails: "CP reference details",
  referenceFloor:
    "Calculation assumptions: catch level {level}, minimum IVs {floor}/{floor}/{floor}.",
  compatible: "Compatible context",
  sameChance: "Same conditional chance in every compatible context",
  contextsCount: "{count} compatible Shadow contexts",
  contextTitle: "Confirm the encounter",
  contextCopy:
    "This CP fits multiple Shadow contexts with different results or chances. Confirm the encounter to narrow it down.",
  scopeHelp:
    "Only Shadow raid and Rocket Grunt/Leader catch CPs are supported. Normal raids, wild catches, Giovanni, research and powered-up Pokémon are outside this check. CP compatibility does not prove where a Pokémon came from, or that this species/form is currently or historically available in a particular encounter. Legendary, mythical and Ultra Beast classifications are excluded from standard Grunt/Leader assumptions. Other per-encounter availability is not asserted.",
  home: "Hundo Check home",
  theme: "Toggle dark mode",
  tools: "Tools",
  skip: "Skip to result",
  guide: "POKÉMON GO / CP FIELD GUIDE",
  title: "Purified hundo check",
  subtitle: "Check catch CP for a possible purified 15 / 15 / 15.",
  checker: "Purification check",
  reference: "Pokémon CP reference",
  encounter: "Your encounter",
  pokemon: "Pokémon",
  search: "Search Pokémon…",
  searchResults: "Pokémon search results",
  quick: "Quick picks",
  where: "Encounter",
  raid: "Shadow raid",
  raidCatch: "Raid catch",
  rocket: "Team GO Rocket",
  grunt: "Grunt or Leader",
  catchCp: "Catch CP",
  enterCp: "Enter CP",
  result: "Result",
  appraisal:
    "Appraisal confirms the IVs. Each must be at least 13 before purification.",
  watch: "Purifiable CP candidates",
  watchHint: "A shortlist for this Pokémon and encounter",
  ordinary: "ORDINARY POKÉMON, TOO",
  referenceTitle: "Perfect CP reference",
  referenceIntro: "Perfect-IV CPs for both weather conditions.",
  referenceNote:
    "Rocket and raid catch references. Wild levels vary. Matching CP alone does not prove perfect IVs.",
  referenceSearch: "Search species, form or Pokédex number…",
  referenceSearchLabel: "Search CP reference",
  normal: "Non-weather boosted",
  boosted: "Weather boosted",
  action: "Action",
  check: "Check",
  more: "Show more Pokémon",
  referenceScope:
    "Released species/forms; Mega, Primal and duplicate Shadow variants are excluded. A listing is not a current encounter rotation.",
  how: "How the check works",
  howHint: "Mechanics, assumptions & data",
  howTitle: "CP narrows the possibilities. Appraisal confirms the IVs.",
  mechanic:
    "Purification adds 2 to each IV, capped at 15. Each IV must be at least 13 beforehand. Shadow battle damage bonuses do not change catch CP.",
  enumeration:
    "We enumerate every legal IV triple at both catch levels and count exact integer CP matches. Shadow raids use levels 20/25 and a 6/6/6 floor. Rocket Grunts/Leaders use levels 8/13 and floors 0/0/0 or weather-boosted 4/4/4. Giovanni, research, powered-up Pokémon and special-event floors need different settings.",
  assumption:
    "Chances assume equally likely legal IV rolls and the correct species, form and encounter. If both weather contexts fit, their probabilities stay separate; no prior probability of weather is assumed. A purifiable hundo is not always the best battle choice.",
  scope: "Catalog and Japanese names",
  source:
    "Released species/forms from pinned PvPoke data. Japanese species/form names use pinned PokeAPI data and documented GO form display labels. Historical Shadow eligibility is not proof of current availability.",
  advanced: "Advanced calculator",
  advancedHint:
    "Custom raid IV floors, manual base stats and detailed comparisons.",
  local: "Calculated on your device.",
  privacy: "Privacy",
  feedback: "Feedback",
  legal:
    "Unofficial fan tool. Pokémon and game data belong to their respective owners. Not affiliated with Niantic, Scopely, Nintendo or The Pokémon Company.",
  viewResult: "View result ↓",
  select: "Select a Pokémon from the search results.",
  noResults: "No matching Pokémon. Try another name or number.",
  auto: "Raid, Rocket and weather checked from catch CP",
  chooseTitle: "Choose a Pokémon from the list",
  chooseCopy: "Select a matching species or form to check its CP.",
  unavailableTitle: "Use the CP reference for this form",
  unavailableCopy:
    "No historical Shadow eligibility in this snapshot. Check availability before using a purification calculation.",
  invalidTitle: "Enter a valid catch CP",
  invalidCopy: "Use a whole number of 10 or more from the catch screen.",
  noMatchTitle: "Check your encounter settings",
  noMatchCopy:
    "This CP fits none of the supported Shadow catch contexts. Check the species/form and catch CP; other encounters or powered-up Pokémon are outside this check.",
  noneTitle: "Cannot purify to a hundo",
  noneCopy: "No compatible IV spread reaches 15/15/15 after purification.",
  allTitle: "Every match can purify to a hundo",
  allCopy:
    "All compatible IV spreads meet 13/13/13 under these encounter settings.",
  ambiguousTitle: "Confirm the weather boost",
  ambiguousCopy:
    "This CP fits both weather conditions with different results or chances. Check the weather icon to narrow it down.",
  possibleTitle: "Possible purified hundo",
  possibleCopy:
    "At least one compatible IV spread reaches 15/15/15 after purification.",
  empty: "Enter CP to check for a possible purified hundo.",
  resultEyebrow: "PURIFIED HUNDO CHECK",
  rocketContext: "Rocket encounter",
  both: "Multiple Shadow contexts match this CP",
  chanceLabel: "chance to purify to a hundo",
  conditional: "Among matching IV spreads",
  details: "Calculation details",
  separate:
    "No combined probability is shown: the relative likelihood of the compatible encounters/weather is unknown.",
  already: "Original perfect IVs",
  alreadyHint:
    "Already 15/15/15 before purification; this is a different probability.",
  before: "Before purification",
  after: "After purification",
  qualifies: "Hundo path",
  yes: "✓ Qualifies",
  no: "— Does not qualify",
  perfect: "✓ Already perfect",
  tableCaption: "Compatible IV spreads · Attack / Defense / HP",
  equalRolls:
    "Assumes uniformly distributed legal IV rolls at this encounter. CP alone does not identify the original IVs.",
  chooseFirst: "Choose a Pokémon first.",
  noShadow: "No historical Shadow eligibility for this form.",
  allMatches: "All qualify",
  level: "Level",
  floor: "IV floor",
  count: "Showing {shown} of {total} species/forms",
  matching: "{good} of {total} matching IV spreads",
  originalCount: "{good} of {total} matching IV spreads",
  matches: "{good}/{total} qualify",
  sourceCount: "{count} released species/forms · snapshot {date}",
  language: "Language",
  languageNote:
    "Language changes preserve the selected species, CP and encounter.",
};
const ja: typeof en = {
  shadowScope:
    "シャドウの捕獲時CP専用。入手元や出現状況はCPだけでは確定できません。",
  unsupportedContextTitle: "対応外の遭遇条件です",
  unsupportedContextCopy:
    "ロケット団の捕獲レベルではCPが一致しますが、この分類のポケモンには通常のしたっぱ・リーダーの最低個体値を適用しません。サカキ・リサーチ・特別イベントは別の条件が必要です。",
  referenceRocket: "ロケット団との遭遇",
  referenceRaids: "レイド",
  referenceMode: "早見表の表示対象",
  markerLegend: "赤い囲み：複数の個体値が一致。選ぶと詳細を表示。",
  markerScope:
    "対応する種族のレイド印はシャドウレイドの条件です。通常レイドとの比較は詳細に表示します。",
  shadowRaidRef: "シャドウレイドの参考値",
  normalRaidRef: "通常レイドの参考値",
  collisionHint:
    "CP{cp}に{count}通りの個体値が一致します。CPだけでは個体値100％とは断定できません。",
  referenceUnique:
    "仮定した捕獲レベル・最低個体値では、CPに一致する組み合わせは1通りです。CPだけで入手元やレベルは確定できません。",
  referenceMatches:
    "仮定したレベル・最低個体値で{count}通りが一致します。15/15/15はそのうち1通りです。",
  normalComparison:
    "通常レイドとの比較：{count}通りが一致（最低個体値10/10/10）。",
  refUnsupported:
    "指定レベルでのCP参考値のみです。この種族・すがたには通常のロケット団モデルを適用しないため、個体値の一致数や確率は示しません。",
  useCp: "このCPで判定する",
  close: "閉じる",
  matchingIvs: "一致する個体値",
  ivAttack: "攻撃",
  ivDefense: "防御",
  ivHp: "HP",
  combinationOne: "一致する個体値は1通り",
  combinationCount: "一致する個体値は{count}通り",
  calculationAssumptions: "計算条件",
  referenceFloor:
    "計算条件：捕獲レベル{level}、最低個体値{floor}/{floor}/{floor}。",
  referenceDetails: "CP参考値の詳細",
  compatible: "一致する遭遇条件",
  sameChance: "一致する全ての遭遇条件で同じ条件付き確率",
  contextsCount: "一致するシャドウ遭遇条件：{count}通り",
  contextTitle: "遭遇条件を確認してください",
  contextCopy:
    "複数のシャドウ遭遇条件でCPが一致しますが、結果や確率が異なります。入手方法と天候を確認してください。",
  scopeHelp:
    "シャドウレイドと、ロケット団のしたっぱ・リーダーの捕獲時CPが対象です。通常レイド、野生、サカキ、リサーチ、強化済み個体は対象外です。CPの一致は入手元や、その種族・すがたが特定の遭遇で出現することを証明しません。伝説・幻・ウルトラビーストの分類には通常のしたっぱ・リーダーの条件を適用しません。その他の遭遇別入手可否も断定しません。",
  home: "Hundo Check ホーム",
  theme: "ダークモード切替",
  tools: "ツール",
  skip: "結果へ移動",
  guide: "POKÉMON GO / CP早見",
  title: "リトレーン100％チェック",
  subtitle: "捕獲時のCPから、リトレーン後に個体値100％になる可能性を確認。",
  checker: "リトレーン判定",
  reference: "ポケモンCP早見表",
  encounter: "遭遇条件",
  pokemon: "ポケモン",
  search: "ポケモンを検索…",
  searchResults: "ポケモンの検索結果",
  quick: "よく使うポケモン",
  where: "入手方法",
  raid: "シャドウレイド",
  raidCatch: "レイドの捕獲時",
  rocket: "GOロケット団",
  grunt: "したっぱ・リーダー",
  catchCp: "捕獲時のCP",
  enterCp: "CPを入力",
  result: "判定結果",
  appraisal:
    "捕獲後の評価で確認できます。リトレーン前の各個体値が13以上である必要があります。",
  watch: "リトレーン100％の候補CP",
  watchHint: "このポケモン・遭遇条件での候補",
  ordinary: "一般のポケモンも検索可能",
  referenceTitle: "個体値100％のCP早見表",
  referenceIntro: "天候ブースト有無ごとの個体値100％のCP。",
  referenceNote:
    "ロケット団・レイドの捕獲時CPの参考値です。野生のレベルは一定ではなく、CPの一致だけで個体値100％とは断定できません。",
  referenceSearch: "名前・すがた・図鑑番号で検索…",
  referenceSearchLabel: "CP早見表を検索",
  normal: "天候ブーストなし",
  boosted: "天候ブーストあり",
  action: "操作",
  check: "判定",
  more: "さらに表示",
  referenceScope:
    "実装済みのポケモン・すがたが対象です。メガ・ゲンシ・重複するシャドウ版は除外。現在出現するポケモンの一覧ではありません。",
  how: "計算方法",
  howHint: "仕組み・前提・データ",
  howTitle: "CPで候補を絞り、評価で個体値を確認します。",
  mechanic:
    "リトレーンで各個体値に2が加算され、最大15になります。事前に各個体値が13以上必要です。シャドウのバトル時のダメージ補正は捕獲時CPに影響しません。",
  enumeration:
    "両方の捕獲レベルで、最低個体値以上の全組み合わせからCPが完全一致するものを数えます。シャドウレイドはレベル20/25、最低6/6/6。ロケット団のしたっぱ・リーダーはレベル8/13、最低0/0/0（天候ブースト時4/4/4）です。サカキ、リサーチ、強化済み個体、特別イベントは条件が異なります。",
  assumption:
    "表示確率は、合法な各個体値の組み合わせが等確率で、種類・すがた・遭遇条件が正しいことを前提とします。複数のシャドウ遭遇条件でCPが一致する場合、確率を分けて表示し、根拠のない合算はしません。バトル用途ではリトレーンが最適とは限りません。",
  scope: "データと日本語名",
  source:
    "実装済み種族・すがたは固定版のPvPokeデータ、日本語名は固定版のPokeAPIと記録したGO用表示名を使用。過去のシャドウ対象であっても、現在入手できるとは限りません。",
  advanced: "詳細計算ツール",
  advancedHint: "レイド最低個体値の変更、種族値の手入力、詳細比較。",
  local: "端末内で計算します。",
  privacy: "プライバシー",
  feedback: "フィードバック",
  legal:
    "非公式ファンツールです。ポケモンおよびゲームデータの権利は各権利者に帰属します。Niantic、Scopely、任天堂、株式会社ポケモンとは関係ありません。",
  viewResult: "結果を見る ↓",
  select: "検索結果からポケモンを選択してください。",
  noResults: "該当するポケモンがいません。別の名前や図鑑番号をお試しください。",
  auto: "捕獲時CPからレイド・ロケット団と天候を自動判定",
  chooseTitle: "検索結果から選択してください",
  chooseCopy: "CPを判定するポケモン・すがたを選んでください。",
  unavailableTitle: "このすがたはCP早見表で確認",
  unavailableCopy:
    "このデータでは過去のシャドウ対象として確認されていません。入手条件をご確認ください。",
  invalidTitle: "正しい捕獲時CPを入力",
  invalidCopy: "捕獲画面に表示された10以上の整数を入力してください。",
  noMatchTitle: "遭遇条件を確認してください",
  noMatchCopy:
    "このCPは対応するシャドウ捕獲条件に一致しません。種類・すがた・捕獲時CPを確認してください。他の入手方法や強化済み個体は対象外です。",
  noneTitle: "リトレーン後100％にはなりません",
  noneCopy:
    "一致する個体値の中に、リトレーン後15/15/15になる組み合わせはありません。",
  allTitle: "一致する全候補がリトレーン後100％",
  allCopy: "この遭遇条件で一致する全ての個体値が13/13/13以上です。",
  ambiguousTitle: "天候ブーストを確認してください",
  ambiguousCopy:
    "複数のシャドウ遭遇条件でCPが一致しますが、リトレーン結果が異なります。天候アイコンで確認してください。",
  possibleTitle: "リトレーン後100％の可能性あり",
  possibleCopy:
    "一致する個体値に、リトレーン後15/15/15になる組み合わせがあります。",
  empty: "CPを入力して、リトレーン後100％の可能性を確認。",
  resultEyebrow: "リトレーン100％判定",
  rocketContext: "ロケット団との遭遇",
  both: "複数のシャドウ遭遇条件でCPが一致",
  chanceLabel: "リトレーン後に個体値100％になる確率",
  conditional: "CPが一致する個体値の中で",
  details: "計算の詳細",
  separate:
    "遭遇・天候条件ごとの出現確率が不明なため、確率を合算していません。",
  already: "捕獲時点で個体値100％",
  alreadyHint:
    "リトレーン前から15/15/15の個体です。リトレーン後100％の確率とは別です。",
  before: "リトレーン前",
  after: "リトレーン後",
  qualifies: "100％への可否",
  yes: "✓ 100％になる",
  no: "— 100％にならない",
  perfect: "✓ 元から100％",
  tableCaption: "CPが一致する個体値 · 攻撃 / 防御 / HP",
  equalRolls:
    "この遭遇条件で、合法な各個体値の組み合わせが等確率と仮定しています。CPだけでは元の個体値を特定できません。",
  chooseFirst: "先にポケモンを選択してください。",
  noShadow: "このすがたは過去のシャドウ対象として未確認です。",
  allMatches: "全候補が該当",
  level: "レベル",
  floor: "最低個体値",
  count: "全{total}種・すがた中、{shown}件を表示",
  matching: "一致する{total}通り中{good}通り",
  originalCount: "元から100％は{total}通り中{good}通り",
  matches: "{total}通り中{good}通り",
  sourceCount: "実装済み{count}種・すがた · データ取得日 {date}",
  language: "言語",
  languageNote: "言語を切り替えても、ポケモン・CP・遭遇条件を引き継ぎます。",
};
export function t(
  key: keyof typeof en,
  values: Record<string, string | number> = {},
) {
  let text = (language === "ja" ? ja : en)[key];
  for (const [k, v] of Object.entries(values))
    text = text.replaceAll(`{${k}}`, String(v));
  return text;
}
export function nameOf(p: { id: string; name: string }) {
  return language === "ja"
    ? ((japanese.names as Record<string, string>)[p.id] ?? p.name)
    : p.name;
}
const types: Record<string, string> = {
  Normal: "ノーマル",
  Fire: "ほのお",
  Water: "みず",
  Electric: "でんき",
  Grass: "くさ",
  Ice: "こおり",
  Fighting: "かくとう",
  Poison: "どく",
  Ground: "じめん",
  Flying: "ひこう",
  Psychic: "エスパー",
  Bug: "むし",
  Rock: "いわ",
  Ghost: "ゴースト",
  Dragon: "ドラゴン",
  Dark: "あく",
  Steel: "はがね",
  Fairy: "フェアリー",
};
export function typesOf(p: { types: string[] }) {
  return p.types
    .map((type) => (language === "ja" ? (types[type] ?? type) : type))
    .join(" / ");
}
export function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/[\s\-_()（）.'’]/g, "");
}
export function japaneseName(id: string) {
  return (japanese.names as Record<string, string>)[id] ?? "";
}
