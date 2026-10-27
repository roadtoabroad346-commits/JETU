// Isolated component-only fixture server. Never serves Auth or calls a real provider.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const server = await createServer({
  root: resolve(root, 'tests/ui'),
  configFile: false,
  resolve: { alias: { '@': resolve(root, 'src') } },
  oxc: { jsx: { runtime: 'automatic' } },
  server: {
    host: '127.0.0.1',
    port: 3200,
    strictPort: true,
    fs: { allow: [root] },
  },
  css: { postcss: { plugins: [] } },
});
await server.listen();
