export function database(env) {
 if (!env.DB?.prepare) throw new Error('Waitlist storage unavailable');
 return env.DB;
}
export async function subscribe(env, email) {
 const id = crypto.randomUUID();
 const token = crypto.randomUUID() + crypto.randomUUID();
 const result = await database(env).prepare('INSERT INTO launch_waitlist (id, email, joined_at, consent_version, unsubscribe_token) VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING').bind(id, email, new Date().toISOString(), 'rhapsody-launch-v1', token).run();
 return {created: result.meta?.changes === 1, token};
}
export async function unsubscribe(env, token) {
 await database(env).prepare('DELETE FROM launch_waitlist WHERE unsubscribe_token = ?').bind(token).run();
}
