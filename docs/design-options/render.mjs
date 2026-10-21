import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const browser=await chromium.launch({channel:'chrome'});
for(const name of ['a-field-guide','b-graphite','c-editorial']){
 const page=await browser.newPage({viewport:{width:390,height:900},deviceScaleFactor:2});
 await page.setContent(readFileSync(`docs/design-options/${name}.html`,'utf8'));
 await page.screenshot({path:`docs/design-options/${name}.png`,fullPage:true});
 await page.close();
}
await browser.close();
