// Serves the real production Worker, including its CSP and honest API failures.
// No production database is connected to the local preview.
import { createServer } from 'node:http';
import { statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const port = Number(process.env.PORT || 8766);
const workerPath = new URL('../dist/server/index.js', import.meta.url);
const server = createServer(async (incoming, outgoing) => {
 try {
  const {default:worker} = await import(pathToFileURL(workerPath.pathname).href + '?v=' + statSync(workerPath).mtimeMs);
  const chunks = [];
  for await (const chunk of incoming) chunks.push(chunk);
  const method = incoming.method;
  const request = new Request(`http://localhost:${port}${incoming.url}`, {
   method, headers: incoming.headers,
   ...(!['GET','HEAD'].includes(method) ? {body:Buffer.concat(chunks)} : {})
  });
  const response = await worker.fetch(request, {});
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
 } catch (error) {
  console.error(error);
  outgoing.writeHead(500, {'Content-Type':'text/plain'});
  outgoing.end('Preview error. Run npm run build and try again.');
 }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}\nProduction Worker preview. Launch-list API has no local database; signups return a real error.`));
