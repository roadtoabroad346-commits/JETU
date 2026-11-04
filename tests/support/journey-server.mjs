import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../..', import.meta.url));
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { '@': `${root}/src` } },
  server: { port: 3201, host: '127.0.0.1', strictPort: true },
});
await server.listen();
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    await server.close();
    process.exit(0);
  });
