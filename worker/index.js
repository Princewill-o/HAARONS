import { subscribe, unsubscribe } from './database.js';
const json = (body, status=200) => new Response(JSON.stringify(body), {status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default {
 async fetch(request,env) {
  const url = new URL(request.url);
  if(url.pathname === '/api/waitlist' || url.pathname === '/api/unsubscribe') {
   if(request.method !== 'POST') return json({error:'Method not allowed'},405);
   if(request.headers.get('Origin') !== url.origin) return json({error:'Please submit using the H.AARONS website.'},403);
   if(!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'Invalid request'},415);
   try {
    const text = await request.text();
    if(text.length > 2048) return json({error:'Request too large'},413);
    let body; try {body=JSON.parse(text);} catch {return json({error:'Invalid request'},400);}
    if(!body || typeof body!=='object' || Array.isArray(body)) return json({error:'Invalid request'},400);
    if(url.pathname === '/api/unsubscribe') {
     if(typeof body.token!=='string'|| !/^[a-f0-9-]{72}$/.test(body.token)) return json({error:'This removal link is invalid.'},400);
     await unsubscribe(env,body.token);
     return json({message:'You have been removed from the RHAPSODY launch list.'});
    }
    if(body.website) return json({message:'Thank you for your interest.'});
    if(body.consent!==true) return json({error:'Please agree to receive RHAPSODY launch updates.'},400);
    const email = typeof body.email==='string' ? body.email.trim().toLowerCase() : '';
    if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:'Please enter a valid email address.'},400);
    const result=await subscribe(env,email);
    if(!result.created) return json({message:'If this address is already on our launch list, it remains registered. Thank you for your interest.'});
    return json({message:'You’re on the list. We’ll email you when there is news about RHAPSODY.',removeUrl:'/leave-list.html#'+result.token},201);
   }catch(error){console.error('Waitlist save failed',error.name);return json({error:'We couldn’t save your request. Please try again shortly.'},503);}
  }
  if(request.method!=='GET'&&request.method!=='HEAD') return new Response('Method not allowed',{status:405});
  const key=url.pathname==='/'?'index.html':url.pathname.slice(1);
  const asset=Object.hasOwn(ASSETS,key)?ASSETS[key]:null;
  if(!asset) return new Response('Page not found',{status:404});
  const bytes=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));
  return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'Cache-Control':key.endsWith('.html')?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"}});
 }
};
