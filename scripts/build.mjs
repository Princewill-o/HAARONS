import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import path from 'node:path';
const assets={};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpeg':'image/jpeg','.jpg':'image/jpeg'};
function collect(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())collect(p);else assets[path.relative('public',p)]={data:readFileSync(p).toString('base64'),type:types[path.extname(p)]||'application/octet-stream'};}}
collect('public');
const db=readFileSync('worker/database.js','utf8').replaceAll('export ','');
const code=readFileSync('worker/index.js','utf8').replace("import { subscribe, unsubscribe } from './database.js';",'');
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
writeFileSync('dist/server/index.js',`const ASSETS=${JSON.stringify(assets)};\n${db}\n${code}`);
writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json'));
console.log('Built H.AARONS website with persistent waitlist.');
