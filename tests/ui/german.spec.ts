import {test,expect} from '@playwright/test';
test('German checker, conditional details and collision dialog use localized names and labels',async({page},info)=>{
 await page.goto('?species=MAGIKARP&cp=61&lang=de');
 await expect(page.locator('html')).toHaveAttribute('lang','de');
 await expect(page.locator('#species-search')).toHaveValue('Karpador');
 await expect(page.locator('.chance-value')).toHaveText('80%');
 await expect(page.locator('#cp-context')).toContainText('Ohne Wetterbonus');
 await page.locator('.result-details summary').click();
 await expect(page.locator('.result-details')).toContainText('Bereits perfekte IVs');
 await expect(page.locator('.result-details')).toContainText('Angriff');
 await page.locator('[data-view=reference]').click();
 await page.locator('#reference-search').fill('Hornliu');
 await page.locator('[data-cp-species=WEEDLE][data-cp-group=rocket][data-cp-boosted=false]').click();
 await expect(page.locator('.reference-ivs thead th')).toHaveText(['Angriff','Verteidigung','KP']);
 await expect(page.locator('.reference-ivs tbody tr')).toHaveCount(4);
 await expect(page.locator('.reference-assumptions')).not.toHaveAttribute('open');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`qa/german-${info.project.name}-dialog.png`,fullPage:true});
});
test('German species/form search accepts English, Japanese and accent-insensitive aliases',async({page})=>{
 await page.goto('?lang=de');
 for(const [query,name]of [['Bisasam','Bisasam'],['Bulbasaur','Bisasam'],['フシギダネ','Bisasam'],['Flabebe','Flabébé'],['Mewtu in Rustung','Mewtu in Rüstung'],['Flutenvariante','Paldea-Tauros (Flutenvariante)']]){
  await page.locator('#species-search').fill(query!);
  await page.locator('#species-search').press('Enter');
  await expect(page.locator('#species-search')).toHaveValue(name!);
 }
});
test('removed costume URLs migrate to Pikachu without changing CP or language',async({page})=>{
 for(const query of ['species=PIKACHU_FLYING','pokemon=Pikachu%20(Flying)','species=PIKACHU_LIBRE']){
  await page.goto(`?${query}&cp=157&lang=de`);
  await expect(page.locator('#species-search')).toHaveValue('Pikachu');
  await expect(page).toHaveURL(/species=PIKACHU&/);
  await expect(page.locator('#cp-input')).toHaveValue('157');
 }
 await page.locator('[data-view=reference]').click();await page.locator('#reference-search').fill('Pikachu');
 await expect(page.locator('#reference-rows tr')).toHaveCount(1);
});
test('German language persists through advanced and back, preserving real names',async({page})=>{
 await page.goto('?species=MEWTWO&cp=2387&lang=de');
 await page.locator('.disclosure').last().locator('summary').click();
 await page.locator('a[href="./advanced.html?lang=de"]').click();
 await expect(page.locator('html')).toHaveAttribute('lang','de');
 await expect(page.locator('#flowPokemonSelect option:checked')).toHaveText('Mewtu (Mewtwo)');
 await expect(page.locator('#pageTitle')).toHaveText('Chance auf ein erlöstes Hundo');
 await expect(page).toHaveURL(/lang=de/);
 await expect(page.locator('#flowPokemonSelect option[value="Deoxys Normal"]')).toHaveText('Deoxys (Normalform) (Deoxys Normal)');
 await expect(page.locator('#flowPokemonSelect option[value="Hoopa Confined"]')).toHaveText('Gebanntes Hoopa (Hoopa Confined)');
 await expect(page.locator('.insight-surface')).toHaveAccessibleName('Aktuelles Ergebnis');
 await page.locator('.settings-drawer summary').click();await page.locator('[data-language-choice=ja]').click();
 await page.locator('a[href="./"]').click();await expect(page.locator('html')).toHaveAttribute('lang','ja');
 await page.locator('[data-language=de]').click();await expect(page.locator('html')).toHaveAttribute('lang','de');
 await page.goto('./');await expect(page.locator('html')).toHaveAttribute('lang','de');
});

test('German narrow layout preserves readable controls and exact conditional odds',async({page},info)=>{
 await page.setViewportSize({width:320,height:780});
 await page.goto('?species=MAGIKARP&cp=61&lang=de');
 await expect(page.locator('.chance-value')).toHaveText('80%');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const languageInsideHeader = await page.locator('.language-toggle').evaluate(e => e.getBoundingClientRect().bottom <= e.closest('header')!.getBoundingClientRect().bottom);
 expect(languageInsideHeader).toBe(true);
 await page.screenshot({path:`qa/german-${info.project.name}-320.png`,fullPage:true});
 await page.locator('.theme-button').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`qa/german-${info.project.name}-320-dark.png`,fullPage:true});
});
