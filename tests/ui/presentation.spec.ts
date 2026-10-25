import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test.beforeEach(async({page},info)=>{if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:800});});
test('already hundo is prominent and conditional in every language without overstating collisions',async({page},info)=>{
 for(const [lang,title]of [['en','Already a hundo'],['ja','元から個体値100％'],['de','Bereits ein Hundo']]){
  await page.goto(`?species=MEWTWO&cp=2387&lang=${lang}`);
  await expect(page.locator('#decision h2')).toHaveText(title!);
  await expect(page.locator('.chance-value')).toHaveText('100%');
  await expect(page.locator('.battle-note')).toBeVisible();
  await expect(page.locator('.result-details')).not.toHaveAttribute('open');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(lang==='en')await page.screenshot({path:`qa/presentation-${info.project.name}-already-hundo.png`,fullPage:true});
  await page.goto(`?species=WEEDLE&cp=102&lang=${lang}`);
  await expect(page.locator('.chance-value')).toHaveText('100%');
  await expect(page.locator('#decision h2')).not.toHaveText(title!);
  await page.goto(`?species=MAGIKARP&cp=61&lang=${lang}`);
  await expect(page.locator('.chance-value')).toHaveText('80%');
  await expect(page.locator('#decision h2')).not.toHaveText(title!);
 }
});
test('reference focus is a distinct square with red ambiguity rings unchanged and Escape restores focus',async({page},info)=>{
 for(const theme of ['light','dark']){
  await page.goto('?view=reference&lang=en');
  await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  await page.locator('#reference-search').fill('Magikarp');
  if(await page.locator('[data-ref-mode=raid]').isVisible())await page.locator('[data-ref-mode=raid]').click();
  const unique=page.locator('[data-cp-species=MAGIKARP][data-cp-group=raid][data-cp-boosted=false]');
  await expect(unique).toHaveText('157');await expect(unique).toHaveAttribute('data-ambiguous','false');
  await unique.focus();await page.keyboard.press('Enter');
  await expect(page.locator('.reference-ivs tbody tr')).toHaveCount(1);
  await page.keyboard.press('Escape');await expect(unique).toBeFocused();
  const style=await unique.evaluate(e=>({focus:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineColor,ink:getComputedStyle(e).getPropertyValue('--ink').trim(),ring:getComputedStyle(e.querySelector('.cp-number')!,'::after').borderTopStyle,radius:getComputedStyle(e).borderRadius}));
  expect(style.focus).toBe(true);expect(style.radius).toBe('0px');expect(style.ring).not.toBe('solid');
  await page.screenshot({path:`qa/presentation-${info.project.name}-focus-${theme}.png`,fullPage:true});
  if(await page.locator('[data-ref-mode=rocket]').isVisible())await page.locator('[data-ref-mode=rocket]').click();
  const marked=page.locator('[data-cp-species=MAGIKARP][data-cp-group=rocket][data-cp-boosted=false]');
  await expect(marked).toHaveAttribute('data-ambiguous','true');await marked.focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');await expect(marked).toBeFocused();
  const colors=await marked.evaluate(e=>({outline:getComputedStyle(e).outlineColor,ring:getComputedStyle(e.querySelector('.cp-number')!,'::after').borderTopColor,stroke:getComputedStyle(e.querySelector('.cp-number')!,'::after').borderTopStyle}));
  expect(colors.outline).not.toBe(colors.ring);expect(colors.stroke).toBe('solid');
  if(info.project.name==='mobile')await page.screenshot({path:`qa/presentation-mobile-marked-focus-${theme}.png`,fullPage:true});
 }
});
test('skip link follows the active view, localizes and moves keyboard focus without changing state',async({page})=>{
 for(const [lang,label]of [['en','Skip to CP reference'],['ja','CP早見表へ移動'],['de','Zur WP-Referenz springen']]){
  await page.goto(`?view=reference&species=MAGIKARP&cp=61&lang=${lang}`);
  const skip=page.locator('.skip');await expect(skip).toHaveText(label!);
  await expect(skip).toHaveAttribute('href','#reference-heading');const before=page.url();
  await skip.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#reference-heading')).toBeFocused();await expect(page.locator('#reference-heading')).toBeVisible();expect(page.url()).toBe(before);
  if(lang==='ja'&&test.info().project.name==='mobile')await page.screenshot({path:'qa/presentation-mobile-skip-ja.png',fullPage:true});
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
  await page.locator('[data-view=check]').click();await expect(skip).toHaveAttribute('href','#decision');await skip.focus();await page.keyboard.press('Enter');await expect(page.locator('#decision')).toBeFocused();await expect(page.locator('#cp-input')).toHaveValue('61');
 }
});

test('200 percent CSS zoom keeps localized result and keyboard reference usable',async({page},info)=>{
 await page.setViewportSize({width:1280,height:900});
 await page.goto('?species=MEWTWO&cp=2387&lang=ja');
 await page.evaluate(()=>document.documentElement.style.zoom='2');
 await expect(page.locator('#decision h2')).toHaveText('元から個体値100％');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('[data-view=reference]').click();await page.locator('.skip').focus();await page.keyboard.press('Enter');await expect(page.locator('#reference-heading')).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`qa/presentation-${info.project.name}-zoom-ja.png`,fullPage:true});
});
