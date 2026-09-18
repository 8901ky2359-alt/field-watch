// The app is a fully static, client-side (offline-capable) Next.js export —
// there is no backend API, so this Worker only serves static assets.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
