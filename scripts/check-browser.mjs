import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
const base = process.env.PREVIEW_URL || 'http://localhost:8766';
const browser = await (process.env.BROWSER === 'webkit' ? webkit : chromium).launch({headless:true, ...(process.env.BROWSER === 'webkit' ? {} : {args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--ignore-gpu-blocklist']})});
const failures = [];
async function check(name, run) {
 try { await run(); console.log(`PASS ${name}`); }
 catch (error) { failures.push(name); console.error(`FAIL ${name}: ${error.message}`); }
}
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {if(/Content Security Policy|Refused to (load|execute)/i.test(message.text()))errors.push(message.text());});
await page.goto(base, {waitUntil:'networkidle'});
await page.evaluate(() => document.documentElement.style.scrollBehavior = 'auto');
const storyScroll = async (target, p) => {
 await target.evaluate(progress => {
  const story = document.querySelector('.scent-journey');
  window.scrollTo({top:story.getBoundingClientRect().top + scrollY + (story.offsetHeight - innerHeight) * progress,behavior:'instant'});
 },p);
 await target.waitForFunction(index => {
  const links=[...document.querySelectorAll('.journey-rail a')];
  return links[index]?.hasAttribute('aria-current');
 },Math.round(p*4),{timeout:15000});
};
await check('story initializes without JavaScript or CSP errors', async () => {
 assert.ok(await page.locator('html').evaluate(e=>e.classList.contains('journey-ready')));
 assert.equal(await page.locator('.journey-chapter').count(),5);
 assert.deepEqual(errors,[]);
 assert.equal(await page.locator('.journey-cta').first().evaluate(e => getComputedStyle(e).color), 'rgb(250, 245, 236)');
});
await check('real 3D renderer initializes and retains the photograph fallback', async () => {
 await page.waitForFunction(()=>document.querySelector('.travelling-bottle').dataset.renderer==='webgl',{},{timeout:30000});
 assert.equal(await page.locator('.bottle-webgl').count(),1);
 assert.equal(await page.locator('.bottle-art').evaluate(e=>getComputedStyle(e).visibility),'hidden');
});
await check('bottle follows scroll, opens, sprays and reveals the notes', async () => {
 const firstX = await page.locator('.travelling-bottle').evaluate(e=>e.getBoundingClientRect().x);
 await storyScroll(page,0.50);
 const nextX = await page.locator('.travelling-bottle').evaluate(e=>e.getBoundingClientRect().x);
 assert.ok(Math.abs(nextX-firstX)>200);
 assert.equal(await page.locator('.journey-rail a[aria-current]').innerText(),'The revelation');
 assert.ok(await page.locator('.journey-stage').evaluate(e=>e.classList.contains('is-spraying')));
 assert.ok(await page.locator('.scent-journey').evaluate(e=>e.classList.contains('notes-released')));
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('.scent-note')).opacity==='1', {}, {timeout:15000});
 await page.getByRole('button',{name:'Experience the mist again'}).click();
 assert.ok(await page.locator('.journey-stage').evaluate(e=>e.classList.contains('replay-spray')));
 await storyScroll(page,0);
 assert.equal(await page.locator('.travelling-bottle').evaluate(e=>e.style.getPropertyValue('--cap-lift')),'0px');
});
await check('menu supports Escape, focus restoration and chapter navigation', async () => {
 await page.getByRole('button',{name:'Open menu'}).click();
 assert.equal(await page.locator('#mobile-nav').evaluate(e=>e.open),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 assert.ok(await page.locator('.menu-toggle').evaluate(e=>e===document.activeElement));
 await page.getByRole('button',{name:'Open menu'}).click();
 await page.locator('#mobile-nav').getByRole('link',{name:'RHAPSODY',exact:true}).click();
 assert.equal(await page.locator('#mobile-nav').evaluate(e=>e.open),false);
});
await check('network failures give a useful message and allow signup retry', async () => {
 await page.route('**/api/waitlist',route=>route.abort());
 await page.locator('#waitlist-email').fill('test@example.test');
 await page.locator('input[name="consent"]').check();
 await page.locator('#waitlist-form button').click();
 await page.waitForFunction(()=>document.querySelector('#waitlist-result').textContent.length>0);
 const message = await page.locator('#waitlist-result').innerText();
 assert.match(message,/connection|try again/i);
 assert.doesNotMatch(message,/Failed to fetch|NetworkError|JSON|Unexpected token/i);
 assert.equal(await page.locator('#waitlist-form button').isEnabled(),true);
 await page.unroute('**/api/waitlist');
});
await check('malformed server responses never claim signup success', async () => {
 await page.route('**/api/waitlist',route=>route.fulfill({status:200,contentType:'text/html',body:'<html>Server error</html>'}));
 await page.locator('#waitlist-form button').click();
 await page.waitForTimeout(200);
 assert.match(await page.locator('#waitlist-result').innerText(),/try again/i);
 assert.equal(await page.locator('#waitlist-email').inputValue(),'test@example.test');
 await page.unroute('**/api/waitlist');
});
await check('local production API fails honestly without a live database', async () => {
 await page.locator('#waitlist-form button').click();
 await page.waitForTimeout(200);
 assert.match(await page.locator('#waitlist-result').innerText(),/try again/i);
 assert.equal(await page.locator('#waitlist-email').inputValue(),'test@example.test');
});
for (const [width,height] of [[390,844],[320,640],[768,1024]]) {
 await check(`layout fits ${width}×${height} at every chapter`, async () => {
  const phone = await browser.newPage({reducedMotion:'reduce',viewport:{width,height},isMobile:width<721,hasTouch:width<721});
  await phone.goto(base,{waitUntil:'networkidle'});
  await phone.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
  for (const p of [0,0.25,0.5,0.75,1]) {
   await storyScroll(phone,p);
   assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow at chapter ${p}`);
   const box = await phone.locator('.travelling-bottle').boundingBox();
   assert.ok(box.x >= -20 && box.x + box.width <= width + 20,`bottle off screen at ${p}`);
  }
  await phone.close();
 });
}
await check('reduced motion shows every note without a spray animation', async () => {
 const reduced = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await reduced.goto(base,{waitUntil:'networkidle'});
 await storyScroll(reduced,0.5);
 assert.equal(await reduced.locator('.spray-replay').isVisible(),false);
 assert.equal(await reduced.locator('.scent-note').first().evaluate(e=>getComputedStyle(e).opacity),'1');
 assert.equal(await reduced.locator('.journey-stage').evaluate(e=>e.classList.contains('is-spraying')),false);
 await reduced.close();
});
await check('WebGL failure keeps the supplied bottle visible and the story usable', async () => {
 const fallback=await browser.newPage();
 await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};});
 await fallback.goto(base,{waitUntil:'networkidle'});
 await fallback.waitForFunction(()=>document.querySelector('.travelling-bottle').dataset.renderer==='fallback');
 assert.equal(await fallback.locator('.bottle-art').evaluate(e=>getComputedStyle(e).visibility),'visible');
 await fallback.close();
});
await check('content remains readable with JavaScript disabled', async () => {
 const staticPage = await browser.newPage({javaScriptEnabled:false});
 await staticPage.goto(base);
 assert.equal(await staticPage.getByRole('heading',{name:'The heart'}).isVisible(),true);
 assert.equal(await staticPage.locator('.scent-note').first().evaluate(e=>getComputedStyle(e).opacity),'1');
 await staticPage.close();
});
await check('no runtime or Content Security Policy errors occurred',async()=>assert.deepEqual(errors,[]));
await browser.close();
if(failures.length) process.exitCode=1;
else console.log('All browser checks passed.');
