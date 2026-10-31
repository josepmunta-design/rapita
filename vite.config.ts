import { defineConfig, type ProxyOptions } from 'vite';
// Local Vite serves the viewer; shared comments run on the deployed API.
// Proxy both dev and preview so they use the same shared comments as the public map.
const commentsProxy:Record<string,ProxyOptions> = {
  '/api/comments': {
    target: 'https://rapita.vercel.app',
    changeOrigin: true,
    configure(proxy) {
      proxy.on('proxyReq', request => {
        request.setHeader('origin', 'https://rapita.vercel.app');
      });
    }
  }
};
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true, proxy: commentsProxy },
  preview: { proxy: commentsProxy }
});
