import * as projectsCollection from './api/projects.js';
import * as projectById from './api/projects/[id].js';
import * as projectShots from './api/projects/[id]/shots.js';
import * as imageApi from './api/image.js';

const METHOD_TO_HANDLER = {
  GET: 'onRequestGet',
  POST: 'onRequestPost',
  PATCH: 'onRequestPatch',
  DELETE: 'onRequestDelete',
  PUT: 'onRequestPut',
};

// Order matters: more specific paths must be listed before the generic
// "/api/projects/:id" pattern so they aren't shadowed by it.
const ROUTES = [
  { pattern: /^\/api\/projects\/?$/, module: projectsCollection, params: [] },
  { pattern: /^\/api\/projects\/([^/]+)\/shots\/?$/, module: projectShots, params: ['id'] },
  { pattern: /^\/api\/projects\/([^/]+)\/?$/, module: projectById, params: ['id'] },
  { pattern: /^\/api\/image\/?$/, module: imageApi, params: [] },
];

export async function route(request, env, ctx) {
  const url = new URL(request.url);

  for (const r of ROUTES) {
    const m = url.pathname.match(r.pattern);
    if (!m) continue;

    const handlerName = METHOD_TO_HANDLER[request.method];
    const handler = handlerName && r.module[handlerName];
    if (!handler) {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
        status: 405,
        headers: { 'content-type': 'application/json' },
      });
    }

    const params = {};
    r.params.forEach((name, i) => { params[name] = decodeURIComponent(m[i + 1]); });

    try {
      return await handler({ request, env, params, waitUntil: ctx && ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {} });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'internal_error', message: String(err && err.message || err) }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (env.ASSETS) return env.ASSETS.fetch(request);
  return new Response('Not Found', { status: 404 });
}

export default {
  fetch: route,
};
