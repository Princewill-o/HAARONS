import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../dist/server/index.js';

test('scroll modules and SVG assets have browser-safe MIME types', async () => {
 for (const name of ['journey.js', 'journey-model.mjs']) {
  const response = await worker.fetch(new Request('https://example.test/' + name), {});
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /javascript/);
 }
});
test('head requests return headers without a response body', async () => {
 const response = await worker.fetch(new Request('https://example.test/', {method:'HEAD'}), {});
 assert.equal(response.status, 200);
 assert.equal(await response.text(), '');
});
test('the scroll film supports partial video reads and suffix ranges', async () => {
 const path = '/assets/videos/rhapsody-scroll.mp4';
 const source = await readFile('public' + path);
 const readRange = range => worker.fetch(new Request('https://example.test' + path, {headers: {Range: range}}), {});
 for (const [range, start, end] of [['bytes=5-18', 5, 18], ['bytes=-9', source.length - 9, source.length - 1]]) {
  const response = await readRange(range);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), `bytes ${start}-${end}/${source.length}`);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), source.subarray(start, end + 1));
 }
 const invalid = await readRange(`bytes=${source.length}-`);
 assert.equal(invalid.status, 416);
});
test('unavailable database returns an honest retryable failure', async () => {
 const response = await worker.fetch(new Request('https://example.test/api/waitlist', {
  method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json'},
  body:JSON.stringify({email:'person@example.test',consent:true})
 }), {});
 assert.equal(response.status,503);
 assert.match((await response.json()).error, /try again/i);
});

test('inherited object names are ordinary missing assets, not server crashes', async () => {
 for(const name of ['constructor','__proto__','toString']){
  const response=await worker.fetch(new Request('https://example.test/'+name),{});
  assert.equal(response.status,404);
 }
});
test('non-object JSON payloads are validation errors', async () => {
 for(const body of [null,[],true,'email@example.test']){
  const response=await worker.fetch(new Request('https://example.test/api/waitlist',{
   method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json'},body:JSON.stringify(body)
  }),{});
  assert.equal(response.status,400);
 }
});
