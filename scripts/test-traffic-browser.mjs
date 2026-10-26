// Builds with a synthetic public site code only when unconfigured. Every browser
// request is intercepted; no GoatCounter or production network traffic is sent.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium,webkit} from 'playwright';
import {expect} from '@playwright/test';
const configPath=resolve('src/traffic-config.json');
const original=readFileSync(configPath,'utf8');
const siteCode=JSON.parse(original).siteCode ?? 'hundo-test-only';
const temporary=JSON.stringify({siteCode},null,2)+'\n';
const origin='https://doomsday126dev.github.io';
const base=origin+'/raid-iv-odds/';
const collector=`https://${siteCode}.goatcounter.com`;
const reports=[];
try {
  writeFileSync(configPath,temporary);
  execFileSync('npm',['run','build'],{stdio:'pipe'});
  for(const [browserName,type,options] of [['Chrome',chromium,{channel:'chrome'}],['WebKit',webkit,{}]]) {
    const browser=await type.launch(options);
    try {
      for(const width of [320,1440]) {
        const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
        try {
          const requests=[],outgoing=[];
          await context.addInitScript(()=>{
            Object.defineProperty(navigator,'webdriver',{get:()=>false});
            Object.defineProperty(document,'referrer',{get:()=> 'https://example.test/dex/PRIVATE_CAPABILITY?share=PRIVATE_SHARE'});
          });
          await context.route('**/*',async route=>{
            const request=route.request(),url=new URL(request.url());
            outgoing.push({url:request.url(),headers:await request.allHeaders()});
            if(url.origin===collector) {
              requests.push({url:request.url(),headers:await request.allHeaders()});
              await route.fulfill({status:200,contentType:'image/gif',body:Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64')});return;
            }
            if(url.origin!==origin || !url.pathname.startsWith('/raid-iv-odds/')) {await route.abort();return;}
            const relative=url.pathname.slice('/raid-iv-odds/'.length)||'index.html';
            try {
              const path=resolve('dist',relative);if(!path.startsWith(resolve('dist')+'/'))throw Error('invalid fixture path');
              const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
              await route.fulfill({status:200,contentType:types[extname(path)]??'application/octet-stream',body:readFileSync(path)});
            } catch {await route.fulfill({status:404,body:'Not found'});}
          });
          const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));
          await page.goto(base+'?species=MAGIKARP&cp=61&private=PRIVATE_INPUT#PRIVATE_FRAGMENT');
          await expect(page.locator('.chance-value')).toHaveText('80%');
          await expect.poll(()=>requests.length).toBe(1);
          await page.locator('#cp-input').fill('62');await page.locator('#cp-input').fill('61');
          await page.locator('[data-view=reference]').click();await page.locator('#reference-search').fill('PRIVATE_SEARCH');
          await page.locator('[data-view=check]').click();
          await page.evaluate(()=>{document.title='PRIVATE_TITLE';history.replaceState(null,'','?share=PRIVATE_SHARE#PRIVATE_CAPABILITY');});
          expect(requests.length).toBe(1);
          await page.goto(base+'advanced.html?pokemon=Mewtwo&cp=2387&lang=de&share=PRIVATE_SHARE');
          await expect(page.locator('#pageTitle')).toHaveText('Chance auf ein erlöstes Hundo');
          await expect.poll(()=>requests.length).toBe(2);
          await page.locator('#flowCpInput').fill('2380');
          expect(requests.length).toBe(2);
          for(const [index,{url,headers}] of requests.entries()) {
            const parsed=new URL(url);
            expect([...parsed.searchParams]).toEqual([['p',index===0?'/':'/advanced'],['t',index===0?'HundoCheck':'HundoCheck advanced'],['r',''],['s',String(width)]]);
            expect(headers.referer).toBeUndefined();expect(headers.cookie).toBeUndefined();
            expect(JSON.stringify({url,headers})).not.toContain('PRIVATE');
          }
          for(const {headers} of outgoing) expect(headers.referer).toBeUndefined();
          expect(errors).toEqual([]);
          reports.push({browser:browserName,width,collectorMocked:true,requests:requests.length,noInputPageviews:true,noPrivatePayload:true,noHttpReferrer:true,noCredentials:true,errors});
        } finally {await context.close();}
      }
    } finally {await browser.close();}
  }
  console.log(JSON.stringify(reports,null,2));
} finally {
  // Never overwrite another actor's newly supplied real configuration.
  if(readFileSync(configPath,'utf8')!==temporary) throw Error('Traffic configuration changed during tests; original was not restored.');
  writeFileSync(configPath,original);
  execFileSync('npm',['run','build'],{stdio:'pipe'});
}
