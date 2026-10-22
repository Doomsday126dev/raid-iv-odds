import { test, expect } from "@playwright/test";

const saved = (page: import("@playwright/test").Page) => page.evaluate(() => JSON.parse(localStorage.getItem("raidIvOdds:v4")!));

test("costume plus custom floor keeps Pikachu, CP and floor through redirects and reload", async ({page}) => {
  await page.goto("?species=PIKACHU_FLYING&floor=10&cp=157");
  await expect(page.locator("#flowPokemonSelect")).toHaveValue("Pikachu");
  await expect(page).toHaveURL(/advanced\.html/);
  let state = await saved(page);
  expect(state).toMatchObject({selectedName:"Pikachu", cp:157, raidFloor:10, manualStats:false, stats:{atk:112,def:96,sta:111}});
  await expect(page.locator("#cpValidation")).not.toContainText("2294");
  await page.reload();
  await expect(page.locator("#flowPokemonSelect")).toHaveValue("Pikachu");
  await page.goto("./advanced.html");
  await expect(page.locator("#flowPokemonSelect")).toHaveValue("Pikachu");
  state = await saved(page);
  expect(state.stats).toEqual({atk:112,def:96,sta:111});
  expect(state.customFloor).toEqual({a:10,d:10,s:10});
});

test("catalog IDs and form aliases preserve custom triples, weather and language", async ({page}) => {
  for (const query of [
    "?species=BULBASAUR&cp=796&floor=10/11/12&weather=boosted&lang=de",
    "advanced.html?species=BULBASAUR&cp=796&floor=10/11/12&weather=boosted&lang=de",
  ]) {
    await page.goto(query);
    await expect(page.locator("#flowPokemonSelect")).toHaveValue("Bulbasaur");
    await expect(page.locator("#flowPokemonSelect option:checked")).toHaveText("Bisasam (Bulbasaur)");
    expect(await saved(page)).toMatchObject({cp:796,weather:"boosted",language:"de",raidFloor:{a:10,d:11,s:12},stats:{atk:118,def:111,sta:128}});
  }
  await page.goto("advanced.html?species=RATTATA_ALOLAN&cp=273&floor=10&lang=de");
  await expect(page.locator("#flowPokemonSelect")).toHaveValue("Rattata (Alolan)");
  await expect(page.locator("#flowPokemonSelect option:checked")).toHaveText("Rattfratz (Alola-Form) (Rattata (Alolan))");
  await page.goto("?species=PIKACHU_LIBRE&cp=536&floor=6/8/10&lang=ja");
  await expect(page.locator("#flowPokemonSelect")).toHaveValue("Pikachu");
  expect(await saved(page)).toMatchObject({selectedName:"Pikachu",language:"ja",raidFloor:{a:6,d:8,s:10},stats:{atk:112,def:96,sta:111}});
});

test("hash species takes precedence and unknown explicit species cannot calculate a fallback", async ({page}) => {
  await page.goto("?species=MEWTWO&cp=2387#?species=PIKACHU_FLYING&cp=157&floor=10&lang=de");
  await expect(page.locator("#flowPokemonSelect")).toHaveValue("Pikachu");
  expect(await saved(page)).toMatchObject({selectedName:"Pikachu",cp:157,raidFloor:10,language:"de"});
  await page.goto("?species=UNKNOWN&cp=157&floor=10&lang=de");
  await expect(page.locator("#primaryInsight")).toContainText("Gültiges Pokémon wählen");
  await expect(page.locator("#flowPokemonSelect")).toHaveValue("");
  await expect(page.locator("#resultsGrid")).toBeEmpty();
  await expect(page.locator("#flowCpInput")).toHaveValue("157");
  await page.locator("#flowPokemonSelect").selectOption("Mewtwo");
  expect(await saved(page)).toMatchObject({selectedName:"Mewtwo",cp:157,raidFloor:10});
});
