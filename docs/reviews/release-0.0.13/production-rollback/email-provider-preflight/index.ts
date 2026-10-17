// Closed after read-only release audit. No environment reads or provider operations.
Deno.serve(() => new Response(JSON.stringify({error:'preflight_closed'}), {status:410,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}}));
