// The scheduled caller authenticates with a database-held token.
Deno.serve(async request => {
    if (request.method !== 'POST') return new Response('', { status: 405 });
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const origin = Deno.env.get('SUPABASE_URL')!;
    const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
    try {
        const body = await request.json();
        if (typeof body.token !== 'string' || body.token.length !== 36) return new Response('', { status: 403 });
        const candidates = await fetch(origin + '/rest/v1/rpc/tk7_expired_media', {
            method: 'POST', headers, body: JSON.stringify({ p_token: body.token }),
            signal: AbortSignal.timeout(10000)
        });
        if (!candidates.ok) return new Response('', { status: 403 });
        const objects: Array<{ name: string }> = await candidates.json();
        if (objects.length) {
            const removed = await fetch(origin + '/storage/v1/object/tk7-tactics-media', {
                method: 'DELETE', headers, body: JSON.stringify({ prefixes: objects.map(object => object.name) }),
                signal: AbortSignal.timeout(15000)
            });
            if (!removed.ok) throw Error('Storage deletion failed');
        }
        return Response.json({ removed: objects.length });
    } catch {
        return Response.json({ error: 'Media cleanup failed' }, { status: 500 });
    }
});
