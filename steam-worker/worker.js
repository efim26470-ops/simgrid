/**
 * SimGrid Steam Connector — Cloudflare Worker
 * Secrets: STEAM_API_KEY
 * Optional vars: ALLOWED_ORIGIN=https://username.github.io
 */
const STEAM = 'https://api.steampowered.com';
const SIM_APP_IDS = new Set([244210, 805550, 266410]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': allowed === '*' ? '*' : (origin === allowed ? origin : allowed),
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8'
    };
    if (request.method === 'OPTIONS') return new Response(null, {headers: cors});
    if (request.method !== 'GET') return json({error:'Method not allowed'},405,cors);
    if (!env.STEAM_API_KEY) return json({error:'STEAM_API_KEY is not configured'},500,cors);
    if (url.pathname === '/health') return json({ok:true,service:'simgrid-steam'},200,cors);
    if (url.pathname !== '/steam/sync') return json({error:'Not found'},404,cors);

    const steamid = url.searchParams.get('steamid') || '';
    if (!/^\d{17}$/.test(steamid)) return json({error:'Invalid SteamID64'},400,cors);

    try {
      const key = encodeURIComponent(env.STEAM_API_KEY);
      const [profileRes, ownedRes, recentRes] = await Promise.all([
        fetch(`${STEAM}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamid}`),
        fetch(`${STEAM}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamid}&include_appinfo=true&include_played_free_games=true&format=json`),
        fetch(`${STEAM}/IPlayerService/GetRecentlyPlayedGames/v1/?key=${key}&steamid=${steamid}&count=50&format=json`)
      ]);
      if (!profileRes.ok || !ownedRes.ok || !recentRes.ok) throw new Error('Steam upstream error');
      const [profileJson, ownedJson, recentJson] = await Promise.all([profileRes.json(),ownedRes.json(),recentRes.json()]);
      const profile = profileJson?.response?.players?.[0] || null;
      const owned = ownedJson?.response?.games || [];
      const recent = recentJson?.response?.games || [];
      const games = owned
        .filter(g => SIM_APP_IDS.has(g.appid) || /assetto|iracing|formula 1|f1\D*2\d|automobilista|rFactor|race room/i.test(g.name || ''))
        .map(g => ({
          appid:g.appid,
          name:g.name,
          playtime_forever:g.playtime_forever || 0,
          playtime_2weeks:g.playtime_2weeks || 0,
          recentlyPlayed:recent.some(r => r.appid === g.appid)
        }))
        .sort((a,b)=>(b.recentlyPlayed-a.recentlyPlayed)||(b.playtime_forever-a.playtime_forever));
      return json({profile,games,recent:recent.slice(0,10),syncedAt:new Date().toISOString()},200,cors);
    } catch (error) {
      return json({error:'Steam request failed',detail:String(error?.message || error)},502,cors);
    }
  }
};

function json(value,status,headers){
  return new Response(JSON.stringify(value),{status,headers});
}
