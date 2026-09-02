import { jsonResponse } from '../lib/db.js';

function extractLatLng(text) {
  if (!text) return null;

  // @lat,lng,zoom  (full Google Maps URL)
  let m = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  // ?q=lat,lng or ?ll=lat,lng or !3dlat!4dlng
  m = text.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  m = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  // bare "lat,lng" text
  m = text.trim().match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }

  return null;
}

export async function onRequestPost(context) {
  const { request } = context;
  const body = await request.json();
  const input = (body.input || body.mapUrl || body.text || '').trim();
  if (!input) return jsonResponse({ error: 'input is required' }, { status: 400 });

  let target = input;

  // short links (maps.app.goo.gl, goo.gl/maps) need a redirect to resolve to the full URL
  const isShortLink = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//.test(input);
  if (isShortLink) {
    try {
      const res = await fetch(input, { redirect: 'follow' });
      target = res.url || input;
    } catch {
      return jsonResponse({ error: 'short_link_resolve_failed' }, { status: 502 });
    }
  }

  const coords = extractLatLng(target);
  if (!coords) return jsonResponse({ error: 'not_found' }, { status: 422 });

  return jsonResponse({ lat: coords.lat, lng: coords.lng, resolvedUrl: target });
}
