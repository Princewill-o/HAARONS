import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdirSync,rmSync} from 'node:fs';
import worker from '../dist/server/index.js';
mkdirSync('.sites-runtime',{recursive:true});const file='.sites-runtime/waitlist-test.sqlite';rmSync(file,{force:true});
let sqlite=new DatabaseSync(file);
for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')))sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
const env = { DB: {
 prepare(query) {
  return { bind(...values) {
   return { async run() {
    const r = sqlite.prepare(query).run(...values);
    return {meta: {changes:r.changes}};
   }};
  }};
 }
}};
const post=(path,body,origin='https://example.test')=>worker.fetch(new Request('https://example.test'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),env);
let r=await post('/api/waitlist',{email:' First@Example.com ',consent:true});assert.equal(r.status,201);const registered=await r.json();assert.ok(registered.removeUrl);
sqlite.close();sqlite=new DatabaseSync(file);assert.equal(sqlite.prepare('SELECT email FROM launch_waitlist').get().email,'first@example.com');
r=await post('/api/waitlist',{email:'first@example.com',consent:true});assert.equal(r.status,200);assert.equal(sqlite.prepare('SELECT count(*) AS n FROM launch_waitlist').get().n,1);
r=await post('/api/waitlist',{email:'bad',consent:true});assert.equal(r.status,400);
r=await post('/api/waitlist',{email:'next@example.com',consent:false});assert.equal(r.status,400);
r=await post('/api/waitlist',{email:'next@example.com',consent:true},'https://other.test');assert.equal(r.status,403);
r=await post('/api/waitlist',{email:'bot@example.com',consent:true,website:'spam'});assert.equal(r.status,200);assert.equal(sqlite.prepare('SELECT count(*) AS n FROM launch_waitlist').get().n,1);
r=await post('/api/unsubscribe',{token:'invalid'});assert.equal(r.status,400);
r=await post('/api/unsubscribe',{token:registered.removeUrl.split('#')[1]});assert.equal(r.status,200);assert.equal(sqlite.prepare('SELECT count(*) AS n FROM launch_waitlist').get().n,0);
r=await worker.fetch(new Request('https://example.test/'),env);assert.equal(r.status,200);assert.match(await r.text(),/id="waitlist-form"/);
r=await worker.fetch(new Request('https://example.test/privacy.html'),env);assert.equal(r.status,200);
sqlite.close();rmSync(file,{force:true});console.log('Passed: persistent signup, duplicate protection, validation, consent, cross-origin rejection, honeypot, removal and page serving.');
