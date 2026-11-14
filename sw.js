/* pwa1: service worker mínimo de Steren. No guarda datos (todo se pide en vivo, nada queda viejo).
   Solo responde las aperturas de página y, si no hay internet, muestra un aviso en vez de la página de error. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;   // datos, fotos y llamadas al servidor: pasan directo, sin tocar
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Steren</title>' +
    '<body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;text-align:center;padding:48px 20px;color:#15202b">' +
    '<h2>Sin conexión</h2><p>Revisa tu internet y vuelve a intentar.</p>' +
    '<button onclick="location.reload()" style="font:inherit;padding:10px 18px;border-radius:10px;border:0;background:#0b4f8a;color:#fff">Reintentar</button></body>',
    {headers: {'Content-Type': 'text/html; charset=utf-8'}})));
});
