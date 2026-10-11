// Copia la app compilada (dist/) a docs/ para publicarla con GitHub Pages
// (Settings → Pages → Deploy from a branch → carpeta /docs). No toca docs/protocolo.
import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

if (!existsSync('dist/index.html')) throw new Error('Primero ejecuta el build (npm run build).');

for (const name of readdirSync('docs')) {
  if (name !== 'protocolo') rmSync(join('docs', name), { recursive: true, force: true });
}
cpSync('dist', 'docs', { recursive: true });
writeFileSync('docs/.nojekyll', '');
console.log('Listo: docs/ contiene la app compilada.');
