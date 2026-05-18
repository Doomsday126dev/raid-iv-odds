import "../ux-enhancements.css";

const TEXT = {
  en: {
    settings: "Settings",
    share: "Share link",
    copied: "Link copied",
    error: "Could not copy link",
    title: "How to use this during a raid",
    steps: [
      "Pick the raid boss. The app fills in base stats automatically.",
      "Keep Shadow raid: 6/6/6 and purify bonus +2 for normal shadow legendary raids.",
      "After catching the boss, type its CP. Check both non-weather and weather-boosted result cards.",
      "If the result is mixed, expand the IV spreads or use the watchlist to see which CPs are guaranteed, partial, or misses.",
    ],
    exampleTitle: "Example",
    example:
      "If a Shadow legendary has a 6/6/6 floor, any spread that is at least 13/13/13 becomes 15/15/15 after purification. Some CPs can be shared by multiple IV spreads, so this app counts every matching spread instead of assuming the CP tells the whole story.",
  },
  ja: {
    settings: "設定",
    share: "リンクを共有",
    copied: "リンクをコピーしました",
    error: "リンクをコピーできませんでした",
    title: "レイド中の使い方",
    steps: [
      "レイドボスを選びます。種族値は自動で入力されます。",
      "通常のシャドウ伝説レイドなら、個体値最低値は6/6/6、リトレーン加算は+2のままにします。",
      "捕獲後にCPを入力し、通常時と天候ブーストの結果カードを確認します。",
      "結果が分岐ありの場合は、個体値候補やウォッチリストで確定・一部対象・対象外のCPを確認します。",
    ],
    exampleTitle: "例",
    example:
      "シャドウ伝説の最低値が6/6/6の場合、リトレーン前13/13/13以上はリトレーン後15/15/15になります。同じCPでも複数の個体値候補があり得るため、このアプリはCPだけで判断せず、該当する全候補を数えます。",
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
