import "../ux-enhancements.css";

const TEXT = {
  en: {
    settings: "Settings",
    share: "Share link",
    copied: "Link copied",
    error: "Could not copy link",
    title: "How to use this before catching",
    steps: [
      "Pick the raid boss before or during the encounter. The app fills in base stats automatically.",
      "Keep Shadow raid: 6/6/6 and purify bonus +2 for normal shadow legendary raids.",
      "When the catch screen shows the CP, type that CP before spending extra balls, berries, or time.",
      "If the result is 0%, you can save effort because that CP cannot purify to hundo. If it is mixed or guaranteed, keep trying and use the odds/watchlist to understand how strong the CP is.",
    ],
    exampleTitle: "Why this saves time",
    example:
      "Once you catch the Pokemon, you can just appraise the IVs in-game. This tool is mainly for the moment before you know the IVs: it checks whether the visible CP has any purified-hundo path, including CPs that come from multiple IV spreads.",
  },
  ja: {
    settings: "設定",
    share: "リンクを共有",
    copied: "リンクをコピーしました",
    error: "リンクをコピーできませんでした",
    title: "捕獲前の使い方",
    steps: [
      "レイド前またはゲットチャレンジ中にレイドボスを選びます。種族値は自動で入力されます。",
      "通常のシャドウ伝説レイドなら、個体値最低値は6/6/6、リトレーン加算は+2のままにします。",
      "ゲット画面にCPが表示されたら、追加のボール・きのみ・時間を使う前にそのCPを入力します。",
      "結果が0%なら、そのCPはリトレーン後100%にならないため労力を節約できます。分岐ありまたは確定なら、捕獲を続けて確率やウォッチリストを確認します。",
    ],
    exampleTitle: "時間を節約できる理由",
    example:
      "捕獲後であればゲーム内の評価で個体値を確認できます。このツールは個体値がまだ分からない捕獲前の場面で、表示CPにリトレーン100%の可能性があるかを確認するためのものです。同じCPに複数の個体値候補がある場合も考慮します。",
  },
} as const;

type Lang = keyof typeof TEXT;

function lang(): Lang {
  return document.documentElement.lang === "ja" ? "ja" : "en";
}

function labels() {
  return TEXT[lang()];
}

function enhanceSettings(): void {
  const panel = document.querySelector<HTMLElement>(".appearance-panel");
  if (!panel || panel.closest(".settings-drawer")) return;
  const drawer = document.createElement("details");
  drawer.className = "settings-drawer";
  const summary = document.createElement("summary");
  summary.className = "settings-summary";
  drawer.append(summary);
  panel.replaceWith(drawer);
  drawer.append(panel);
}

function enhanceShare(): void {
  const utilityBar = document.querySelector<HTMLElement>(".utility-bar");
  if (!utilityBar || document.getElementById("shareLinkButton")) return;
  const button = document.createElement("button");
  button.id = "shareLinkButton";
  button.type = "button";
  button.className = "secondary-button share-button";
  const status = document.createElement("span");
  status.className = "sr-only";
  status.setAttribute("aria-live", "polite");
  button.addEventListener("click", async () => {
    const current = labels();
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else throw new Error("No share API");
      button.textContent = current.copied;
      status.textContent = current.copied;
    } catch {
      button.textContent = current.error;
      status.textContent = current.error;
    }
    window.setTimeout(renderEnhancementText, 1600);
  });
  utilityBar.append(button, status);
}

function enhanceTutorial(): void {
  if (document.getElementById("raidTutorialPanel")) return;
  const notes = document.querySelector<HTMLElement>(".notes-panel");
  if (!notes) return;
  const panel = document.createElement("details");
  panel.id = "raidTutorialPanel";
  panel.className = "tutorial-panel";
  panel.innerHTML = `
    <summary class="tutorial-summary" data-ux="title"></summary>
    <ol class="tutorial-list">
      <li data-ux-step="0"></li>
      <li data-ux-step="1"></li>
      <li data-ux-step="2"></li>
      <li data-ux-step="3"></li>
    </ol>
    <div class="tutorial-example">
      <strong data-ux="exampleTitle"></strong>
      <p data-ux="example"></p>
    </div>
  `;
  notes.insertAdjacentElement("afterend", panel);
}

function renderEnhancementText(): void {
  const current = labels();
  const settingsSummary = document.querySelector<HTMLElement>(".settings-summary");
  if (settingsSummary) settingsSummary.textContent = current.settings;
  const shareButton = document.getElementById("shareLinkButton");
  if (shareButton) shareButton.textContent = current.share;
  document.querySelectorAll<HTMLElement>("[data-ux]").forEach((node) => {
    const key = node.dataset.ux as "title" | "exampleTitle" | "example" | undefined;
    if (key) node.textContent = current[key];
  });
  document.querySelectorAll<HTMLElement>("[data-ux-step]").forEach((node) => {
    const index = Number(node.dataset.uxStep);
    node.textContent = current.steps[index] || "";
  });
}

function init(): void {
  enhanceSettings();
  enhanceShare();
  enhanceTutorial();
  renderEnhancementText();
  new MutationObserver(renderEnhancementText).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
}

document.addEventListener("DOMContentLoaded", init);
